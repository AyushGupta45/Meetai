import { meetingsRouter } from "@/module/meetings/server/procedure";
import { agentsRouter } from "@/module/agents/server/procedures";
import { premiumRouter } from "@/module/premium/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  agents: agentsRouter,
  meetings: meetingsRouter,
  premium: premiumRouter,
});

export type AppRouter = typeof appRouter;
