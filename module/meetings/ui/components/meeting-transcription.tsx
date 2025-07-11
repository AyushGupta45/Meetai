import React, { useState } from "react";
import { MeetingGetOne } from "../../types";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatarUri } from "@/lib/avatar";
import { authClient } from "@/lib/auth-client";
import { SearchIcon } from "lucide-react";
import Highlighter from "react-highlight-words";

interface Props {
  data: MeetingGetOne;
}

const MeetingTranscription = ({ data }: Props) => {
  const { data: userData } = authClient.useSession();
  const [searchQuery, setSearchQuery] = useState("");

  let conversationHistory = [];
  try {
    conversationHistory = JSON.parse(data.conversationHistory || "[]");
  } catch (err) {
    console.error("Invalid JSON in conversationHistory");
  }

  return (
    <div className="bg-white rounded-lg border w-full max-h-[calc(80vh-72px)] flex flex-col gap-y-4 p-2">
      <div className="p-4 pb-3 gap-y-5 flex flex-col shrink-0">
        <p className="text-2xl font-medium">Meeting Transcription</p>
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="pl-7 h-9 w-[240px]"
          />
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex flex-col gap-y-4 overflow-auto px-4 pb-4 no-scrollbar">
        {conversationHistory.map((msg: any, idx: number) => {
          const isUser = msg.role === "user";
          const name = isUser
            ? userData?.user?.name || "You"
            : data.agent?.name || "Assistant";

          const avatarSrc = isUser
            ? userData?.user?.image ||
              GeneratedAvatarUri({ seed: name, variant: "initials" })
            : GeneratedAvatarUri({ seed: name, variant: "botttsNeutral" });

          if (
            searchQuery &&
            !msg.content.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            return null;
          }

          return (
            <div
              key={idx}
              className="flex flex-col gap-y-2 hover:bg-muted p-4 rounded-md border"
            >
              <div className="flex gap-x-2 items-center">
                <Avatar className="size-6">
                  <AvatarImage src={avatarSrc} />
                </Avatar>
                <p className="text-sm font-medium">{name}</p>
                <p className="text-sm text-blue-500 font-medium">
                  {msg.timestamp ? msg.timestamp : null}
                </p>
              </div>
              <Highlighter
                className="text-sm text-neutral-700"
                highlightClassName="bg-yellow-200"
                searchWords={[searchQuery]}
                autoEscape={true}
                textToHighlight={msg.content}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingTranscription;
