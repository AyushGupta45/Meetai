import { meetingsRouter } from "@/module/meetings/server/procedure";
import { agentsRouter } from "@/module/agents/server/procedures";
import { credentialsRouter } from "@/module/credentials/server/procedures";
import { dashboardRouter } from "@/module/home/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
  credentials: credentialsRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
