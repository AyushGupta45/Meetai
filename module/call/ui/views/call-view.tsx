"use client";

import ErrorState from "@/components/error-state";
import LoadingState from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../../components/call-provider";

interface Props {
  meetingId: string;
}

const CallView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );

  if (data.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        {" "}
        <ErrorState
          title="Meeting has ended"
          description="The meeting you were trying to join has already ended."
        />
      </div>
    );
  }
  return <CallProvider meetingId={meetingId} meetingName={data.name} />;
};

export default CallView;

export const CallViewLoading = () => {
  return (
    <LoadingState
      title="Loading Call"
      description="This may take few seconds"
    />
  );
};
export const CallViewError = () => {
  return (
    <ErrorState title="Error loading Call" description="Something went wrong" />
  );
};
