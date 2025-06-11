"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import React from "react";

const HomeView = () => {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  if (!session) {
    return <p>Loding....</p>;
  }

  return (
    <div className="Flex flex-col p-4 gap-y-4">
      <p>Logged in as {session.user.name}</p>
      <Button
        onClick={() =>
          authClient.signOut({
            fetchOptions: {
              onSuccess: () => router.push("/sign-in"),
            },
          })
        }
      >
        signOut
      </Button>
    </div>
  );
};

export default HomeView;
