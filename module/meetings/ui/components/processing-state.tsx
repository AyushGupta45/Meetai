import EmptyState from "@/components/empty-state";

export const ProcessingState = () => {
  return (
    <div className="bg-card rounded-lg border px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/processing.svg"
        title="Meeting completed"
        description="Meeting was completed. Summary will appear soon"
      />
    </div>
  );
};
