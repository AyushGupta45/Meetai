import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { CredentialInsertSchema, CredentialUpdateSchema } from "../schema";
import {
  createCredential,
  getAllCredentials,
  getCredentialById,
  getManyCredentials,
  removeCredential,
  testCredentialConnection,
  updateCredential,
} from "./credential-queries";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/module/meetings/constants";

export const credentialsRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
      }),
    )
    .query(async ({ ctx, input }) => {
      return getManyCredentials(ctx.auth.user.id, input.page, input.pageSize);
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return getCredentialById(input.id, ctx.auth.user.id);
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return getAllCredentials(ctx.auth.user.id);
  }),

  create: protectedProcedure
    .input(CredentialInsertSchema)
    .mutation(async ({ ctx, input }) => {
      return createCredential(input, ctx.auth.user.id);
    }),

  update: protectedProcedure
    .input(CredentialUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      return updateCredential(input, ctx.auth.user.id);
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return removeCredential(input.id, ctx.auth.user.id);
    }),

  testConnection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return testCredentialConnection(input.id, ctx.auth.user.id);
    }),
});
