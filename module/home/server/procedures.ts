import { db } from "@/db";
import { agents, credentials, meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { and, count, desc, eq, gte, getTableColumns, sql } from "drizzle-orm";
import { startOfWeek, subDays } from "date-fns";

export const dashboardRouter = createTRPCRouter({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.user.id;

    // Count agents
    const [agentCount] = await db
      .select({ count: count() })
      .from(agents)
      .where(eq(agents.userId, userId));

    // Count meetings
    const [meetingCount] = await db
      .select({ count: count() })
      .from(meetings)
      .where(eq(meetings.userId, userId));

    // Count meetings this week
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const [meetingsThisWeek] = await db
      .select({ count: count() })
      .from(meetings)
      .where(
        and(eq(meetings.userId, userId), gte(meetings.createdAt, weekStart)),
      );

    // Count credentials
    const [credentialCount] = await db
      .select({ count: count() })
      .from(credentials)
      .where(eq(credentials.userId, userId));

    // Completed meetings count
    const [completedCount] = await db
      .select({ count: count() })
      .from(meetings)
      .where(
        and(eq(meetings.userId, userId), eq(meetings.status, "completed")),
      );

    // Upcoming meetings count
    const [upcomingCount] = await db
      .select({ count: count() })
      .from(meetings)
      .where(and(eq(meetings.userId, userId), eq(meetings.status, "upcoming")));

    // Average meeting duration in seconds (for completed meetings)
    const [avgDuration] = await db
      .select({
        avg: sql<number>`
          AVG(EXTRACT(EPOCH FROM (
            CASE 
              WHEN started_at IS NOT NULL AND ended_at IS NOT NULL THEN ended_at - started_at
            END
          )))
        `.as("avg"),
      })
      .from(meetings)
      .where(
        and(eq(meetings.userId, userId), eq(meetings.status, "completed")),
      );

    // Meetings per day for last 7 days (for chart)
    const sevenDaysAgo = subDays(new Date(), 6);
    const meetingsPerDay = await db
      .select({
        date: sql<string>`TO_CHAR(created_at, 'YYYY-MM-DD')`.as("date"),
        count: count(),
      })
      .from(meetings)
      .where(
        and(eq(meetings.userId, userId), gte(meetings.createdAt, sevenDaysAgo)),
      )
      .groupBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(created_at, 'YYYY-MM-DD')`);

    // Meetings per agent (top 5)
    const meetingsPerAgent = await db
      .select({
        agentName: agents.name,
        count: count(),
      })
      .from(meetings)
      .innerJoin(agents, eq(meetings.agentId, agents.id))
      .where(eq(meetings.userId, userId))
      .groupBy(agents.name)
      .orderBy(desc(count()))
      .limit(5);

    // Recent meetings (last 5)
    const recentMeetings = await db
      .select({
        ...getTableColumns(meetings),
        agent: agents,
      })
      .from(meetings)
      .innerJoin(agents, eq(meetings.agentId, agents.id))
      .where(eq(meetings.userId, userId))
      .orderBy(desc(meetings.createdAt))
      .limit(5);

    return {
      agentCount: agentCount.count,
      meetingCount: meetingCount.count,
      meetingsThisWeek: meetingsThisWeek.count,
      credentialCount: credentialCount.count,
      completedCount: completedCount.count,
      upcomingCount: upcomingCount.count,
      avgDurationSeconds: avgDuration.avg ? Math.round(avgDuration.avg) : null,
      meetingsPerDay,
      meetingsPerAgent,
      recentMeetings,
    };
  }),
});
