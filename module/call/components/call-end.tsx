import Link from "next/link";
import { Button } from "@/components/ui/button";

export const CallEnd = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
        <div className="flex flex-col gap-y-2 text-center">
          <h6 className="text-lg font-medoum">The meeting has ended</h6>
          <p className="text-sm">
            Summary of this meeting will be available shortly.
          </p>
        </div>

        <Button asChild>
          <Link href="/meetings">Back to meetings</Link>
        </Button>
      </div>
    </div>
  );
};