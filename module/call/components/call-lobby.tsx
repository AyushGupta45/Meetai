import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { GeneratedAvatarUri } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { LogInIcon } from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

interface Props {
  onJoin: () => void;
}

const DisabledVideoPreview = () => {
  const { data } = authClient.useSession();

  const image =
    data?.user.image ??
    GeneratedAvatarUri({
      seed: data?.user.name ?? "",
      variant: "initials",
    });

  return (
    <div className=" bg-muted rounded-md flex w-[400px] h-[200px] items-center justify-center border">
      <Image
        src={image}
        alt="User Avatar"
        width={64}
        height={64}
        className="rounded-full"
      />
    
    </div>
  );
};

export const CallLobby = ({ onJoin }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
        <div className="flex flex-col gap-y-2 text-center">
          <h6 className="text-lg font-medium">Ready to join?</h6>
          <p className="text-sm">Set up your call before joining</p>
        </div>

        <DisabledVideoPreview />

        <div className="text-sm text-muted-foreground text-center">
          Your agent is waiting. Join the call to get started.
        </div>

        <div className="flex gap-y-2 justify-between w-full mt-4">
          <Button asChild variant="ghost">
            <Link href="/meetings">Cancel</Link>
          </Button>
          <Button onClick={onJoin}>
            <LogInIcon className="mr-2 h-4 w-4" />
            Join Call
          </Button>
        </div>
      </div>
    </div>
  );
};
