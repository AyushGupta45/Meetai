import { auth } from "@/lib/auth";
import HomeView from "@/module/home/ui/views/home-view";
import LandingView from "@/module/home/ui/views/landing-view";
import { headers } from "next/headers";
import React from "react";
import { createTRPCContext } from "@/trpc/init";
import { createCallerFactory } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { makeQueryClient } from "@/trpc/query-client";

const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <LandingView />;
  }

  const queryClient = makeQueryClient();

  const caller = createCallerFactory(appRouter)(await createTRPCContext());
  void queryClient.prefetchQuery({
    queryKey: [["dashboard", "getStats"], { type: "query" }],
    queryFn: () => caller.dashboard.getStats(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeView />
    </HydrationBoundary>
  );
};

export default Page;
