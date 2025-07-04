import Link from "next/link";
import { Button } from "@/components/ui/button";

export const CallHold = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
        <div className="flex flex-col gap-y-2 text-center">
          <h6 className="text-lg font-medium">The meeting has been stalled</h6>
          <p className="text-sm">
            The meeting has been put on hold. You can resume it later or leave
            the meeting.
          </p>
        </div>

        <Button asChild>
          <Link href="/meetings">Back to meetings</Link>
        </Button>
      </div>
    </div>
  );
};
