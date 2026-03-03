import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "../constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schema";
import { MeetingStatus } from "../types";
import {
  getAgentStreamResponse,
  generateMeetingSummary,
  getMeetingChatResponse,
  extractActionItems,
} from "./llm-actions";

export const meetingsRouter = createTRPCRouter({
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)),
        )
        .returning();

      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return updatedMeeting;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)),
        )
        .returning();

      if (!removedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return removedMeeting;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration: sql<number>`
                  EXTRACT(EPOCH FROM (
                    CASE 
                      WHEN started_at IS NOT NULL AND ended_at IS NOT NULL AND haulted_at IS NULL AND restarted_at IS NULL THEN ended_at - started_at
                      WHEN started_at IS NOT NULL AND haulted_at IS NOT NULL AND restarted_at IS NOT NULL AND ended_at IS NOT NULL THEN 
                        (haulted_at - started_at) + (ended_at - restarted_at)
                    END
                  ))
          `.as("duration"),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)),
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return existingMeeting;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        agentId: z.string().nullish(),
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Processing,
          ])
          .nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize, status, agentId } = input;
      const data = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration: sql<number>`
                  EXTRACT(EPOCH FROM (
                    CASE 
                      WHEN started_at IS NOT NULL AND ended_at IS NOT NULL AND haulted_at IS NULL AND restarted_at IS NULL THEN ended_at - started_at
                      WHEN started_at IS NOT NULL AND haulted_at IS NOT NULL AND restarted_at IS NOT NULL AND ended_at IS NOT NULL THEN 
                        (haulted_at - started_at) + (ended_at - restarted_at)
                    END
                  ))
          `.as("duration"),
        })

        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined,
          ),
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined,
          ),
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),

  create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdMeeting] = await db
        .insert(meetings)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, createdMeeting.agentId));

      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      const call = {
        id: `call-${createdMeeting.id}`,
        createdBy: ctx.auth.user.id,
        meetingId: createdMeeting.id,
        status: "created",
        settings: {
          transcription: {
            language: "en",
            mode: "auto-on",
          },
          recording: {
            mode: "auto-on",
            quality: "1080p",
          },
        },
      };

      return {
        ...createdMeeting,
        call, // include simulated call in response
      };
    }),

  // ─── LLM-powered mutations ───

  agentRespond: protectedProcedure
    .input(
      z.object({
        agentName: z.string(),
        agentInstructions: z.string(),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            timestamp: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stream = await getAgentStreamResponse({
        userId: ctx.auth.user.id,
        agentName: input.agentName,
        agentInstructions: input.agentInstructions,
        conversationHistory: input.conversationHistory,
      });

      // Read the entire stream and return text
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      return { text: fullText.trim() };
    }),

  processSummary: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            timestamp: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id),
          ),
        );

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      await db
        .update(meetings)
        .set({
          status: "processing",
          conversationHistory: JSON.stringify(input.conversationHistory),
          endedAt: new Date(),
        })
        .where(eq(meetings.id, input.meetingId));

      const [summaryText, actionItemsJson] = await Promise.all([
        generateMeetingSummary({
          userId: ctx.auth.user.id,
          conversationHistory: input.conversationHistory,
        }),
        extractActionItems({
          userId: ctx.auth.user.id,
          conversationHistory: input.conversationHistory,
        }),
      ]);

      await db
        .update(meetings)
        .set({
          summary: summaryText,
          actionItems: actionItemsJson,
          status: "completed",
        })
        .where(eq(meetings.id, input.meetingId));

      return { success: true };
    }),

  meetingChat: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["system", "user", "assistant"]),
            content: z.string(),
          }),
        ),
        summary: z.string(),
        instructions: z.string(),
        agentName: z.string(),
        userName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const replyContent = await getMeetingChatResponse({
        userId: ctx.auth.user.id,
        agentName: input.agentName,
        userName: input.userName,
        instructions: input.instructions,
        summary: input.summary,
        messages: input.messages,
      });

      const assistantMessage = {
        role: "assistant" as const,
        content: replyContent,
        name: input.agentName,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...input.messages, assistantMessage];

      await db
        .update(meetings)
        .set({
          chatHistory: JSON.stringify(updatedMessages),
        })
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id),
          ),
        );

      return { reply: assistantMessage };
    }),

  saveMeetingState: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
            timestamp: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id),
          ),
        );

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      await db
        .update(meetings)
        .set({
          conversationHistory: JSON.stringify(input.conversationHistory),
          haultedAt: new Date(),
          restartedAt: null,
        })
        .where(eq(meetings.id, input.meetingId));

      return { success: true };
    }),

  meetingStatus: protectedProcedure
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [meeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id),
          ),
        );

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      if (!meeting.startedAt) {
        await db
          .update(meetings)
          .set({ status: "active", startedAt: new Date() })
          .where(eq(meetings.id, input.meetingId));

        return { success: true, message: "Meeting started" };
      }

      if (meeting.haultedAt && !meeting.restartedAt) {
        await db
          .update(meetings)
          .set({ status: "active", restartedAt: new Date() })
          .where(eq(meetings.id, input.meetingId));

        return { success: true, message: "Meeting resumed" };
      }

      return { success: false, message: "Meeting already active or resumed" };
    }),
});
