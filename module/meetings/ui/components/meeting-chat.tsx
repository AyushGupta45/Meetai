import React, { useEffect, useRef, useState } from "react";
import { MeetingGetOne } from "../../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatarUri } from "@/lib/avatar";
import { authClient } from "@/lib/auth-client";
import { format } from "date-fns";
import { MessageSquareCode, SendHorizonal } from "lucide-react";

interface Props {
  data: MeetingGetOne;
}

const MeetingChat = ({ data }: Props) => {
  const { data: session } = authClient.useSession();
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setShowTyping(true);

    try {
      const res = await fetch("/api/meeting-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map(({ role, content }) => ({
            role,
            content,
          })),
          summary: data.summary,
          instructions: data.agent.instructions,
          agentName: data.agent.name,
          userName: session?.user.name
        }),
      });

      const { reply } = await res.json();

      const assistantMessage = {
        ...reply,
        timestamp: new Date().toISOString(),
        name: data.agent.name || "Assistant",
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setShowTyping(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  const renderUserMessage = (msg: any, idx: number) => {
    const name = session?.user?.name || "You";
    const avatarSrc =
      session?.user?.image ||
      GeneratedAvatarUri({ seed: name, variant: "initials" });

    return (
      <div key={idx} className="flex justify-end">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          <div className="flex items-end gap-2">
            <div className="flex flex-col px-3 py-2 bg-muted text-foreground whitespace-pre-line rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl border">
              <p className="text-sm">{msg.content}</p>
            </div>
            <Avatar className="size-6">
              <AvatarImage src={avatarSrc} />
            </Avatar>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <span>Today at {format(new Date(msg.timestamp), "p")}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAssistantMessage = (msg: any, idx: number) => {
    const name = msg.name || data.agent.name || "Assistant";
    const avatarSrc = GeneratedAvatarUri({
      seed: name,
      variant: "botttsNeutral",
    });

    return (
      <div key={idx} className="flex justify-start">
        <div className="flex flex-col gap-1 max-w-[75%]">
          <div className="flex items-end gap-2">
            <Avatar className="size-6">
              <AvatarImage src={avatarSrc} />
            </Avatar>

            <div className="flex flex-col px-3 py-2 bg-muted text-foreground whitespace-pre-line rounded-tr-2xl rounded-tl-2xl rounded-br-2xl border">
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            <span>
              {name} • {format(new Date(msg.timestamp), "p")}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    const name = data.agent.name || "Assistant";
    const avatarSrc = GeneratedAvatarUri({
      seed: name,
      variant: "botttsNeutral",
    });

    return (
      <div className="flex justify-start">
        <div className="flex flex-col gap-1 max-w-[75%]">
          <div className="flex items-end gap-2">
            <Avatar className="size-6">
              <AvatarImage src={avatarSrc} />
            </Avatar>
            <div className="flex px-3 py-2 bg-muted rounded-tr-2xl rounded-tl-2xl rounded-br-2xl border">
              <div className="flex space-x-1">
                <span className="animate-bounce delay-0">.</span>
                <span className="animate-bounce delay-150">.</span>
                <span className="animate-bounce delay-300">.</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground px-1">
            <span>{name} is typing...</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border w-full h-[calc(80vh-72px)] flex flex-col p-2 overflow-hidden">
      {chatMessages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground select-none">
          <MessageSquareCode
            strokeWidth={1.5}
            className="size-36 text-muted-foreground"
          />
          <p className="text-2xl text-muted-foreground">No chats yet...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4 no-scrollbar">
          {chatMessages.map((msg, idx) =>
            msg.role === "user"
              ? renderUserMessage(msg, idx)
              : renderAssistantMessage(msg, idx)
          )}
          {showTyping && renderTypingIndicator()}
          <div ref={endOfMessagesRef} />
        </div>
      )}

      <div className="flex items-center gap-2 p-2 border-t pt-3">
        <Input
          placeholder="Ask a question about the meeting..."
          value={input}
          className="w-full"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={!input.trim() || loading}>
          <SendHorizonal />
          {loading ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
};

export default MeetingChat;
