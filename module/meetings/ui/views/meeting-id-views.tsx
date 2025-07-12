"use client";
import ErrorState from "@/components/error-state";
import LoadingState from "@/components/loading-state";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { useState } from "react";
import MeetingIdViewHeader from "../components/meeting-id-view-header";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { UpcomingState } from "../components/upcoming-state";
import { ActiveState } from "../components/active-state";
import { ProcessingState } from "../components/processing-state";
import { CompletedState } from "../components/completed-state";

interface Props {
  meetingId: string;
}

const MeetingIdView = ({ meetingId }: Props) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );

  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.meetings.getMany.queryOptions({})
        );
        await queryClient.invalidateQueries(
          trpc.premium.getFreeUsage.queryOptions()
        );
        router.push("/meetings");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure",
    `The following action will remove this meetings details`
  );

  const [MarkAsCompletedConfirmation, confirmMarkAsCompleted] = useConfirm(
    "Mark as Completed?",
    "This will process the meeting summary and mark the meeting as completed."
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();
    if (!ok) return;

    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const handleMarkAsCompleted = async () => {
    const ok = await confirmMarkAsCompleted();
    if (!ok) return;

    try {
      const response = await fetch("/api/process-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meetingId,
          conversationHistory: data.conversationHistory,
        }),
      });

      router.push("/meetings");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process meeting summary.");
      }

      toast.success("Meeting marked as completed and summary processed.");
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred.");
    }
  };

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <>
      <RemoveConfirmation />
      <MarkAsCompletedConfirmation />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
          canEdit={isUpcoming}
          canMarkAsCompleted={isActive}
          onMarkAsCompleted={handleMarkAsCompleted}
        />
        {isCompleted && <CompletedState data={data} />}
        {isProcessing && <ProcessingState />}
        {isUpcoming && <UpcomingState meetingId={meetingId} />}
        {isActive && <ActiveState meetingId={meetingId} />}
      </div>
    </>
  );
};

export default MeetingIdView;

export const MeetingIdLoading = () => {
  return (
    <LoadingState
      title="Loading Meeting"
      description="This may take few seconds"
    />
  );
};
export const MeetingIdError = () => {
  return (
    <ErrorState
      title="Error loading Meeting"
      description="Something went wrong"
    />
  );
};
