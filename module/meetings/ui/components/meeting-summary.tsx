import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { ClockFadingIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { MeetingGetOne } from "../../types";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

interface Props {
  data: MeetingGetOne;
}

const MeetingSummary = ({ data }: Props) => {
  return (
    <div className="bg-white rounded-lg border w-full max-h-[calc(80vh-72px)] flex flex-col p-2">
      <div className="p-4 pb-3 gap-y-5 flex flex-col shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium capitalize">{data.name}</h2>
          <Badge
            variant="outline"
            className="flex items-center gap-x-2 [&>svg]:size-4"
          >
            <ClockFadingIcon className="text-blue-700" />
            <p className="text-sm">
              {data.duration ? formatDuration(data.duration) : "No duration"}
            </p>
          </Badge>
        </div>

        <div className="flex gap-x-4 items-center">
          <Link
            href={`/agents/${data.agent.id}`}
            className="flex items-center gap-x-2 underline underline-offset-4 capitalize"
          >
            <GeneratedAvatar
              variant="botttsNeutral"
              seed={data.agent.name}
              className="size-5"
            />
            {data.agent.name}
          </Link>
          <p>{data.startedAt ? format(data.startedAt, "PPP") : ""}</p>
          
        </div>
        <div className="flex gap-x-2 items-center mt-2">
          <SparklesIcon className="size-5" />
          <p className="text-xl font-medium">General summary</p>
        </div>
        <Separator/>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-4 no-scrollbar">
        <Markdown
          components={{
            h1: (props) => (
              <h1
                className="text-4xl font-bold tracking-tight mb-6 mt-3 first:mt-0"
                {...props}
              />
            ),
            h2: (props) => (
              <h2
                className="text-3xl font-semibold tracking-tight mb-5 mt-2 first:mt-0"
                {...props}
              />
            ),
            h3: (props) => (
              <h3
                className="text-2xl font-semibold tracking-tight mb-4 mt-2"
                {...props}
              />
            ),
            h4: (props) => (
              <h4
                className="text-xl font-medium tracking-tight mb-3 mt-1"
                {...props}
              />
            ),
            p: (props) => (
              <p
                className="text-base leading-7 mb-5 text-gray-800"
                {...props}
              />
            ),
            ul: (props) => (
              <ul
                className="list-disc pl-6 mb-5 text-base leading-7 text-gray-800"
                {...props}
              />
            ),
            ol: (props) => (
              <ol
                className="list-decimal pl-6 mb-5 text-base leading-7 text-gray-800"
                {...props}
              />
            ),
            li: (props) => (
              <li className="mb-2 marker:text-gray-500" {...props} />
            ),
            strong: (props) => (
              <strong className="font-semibold text-gray-900" {...props} />
            ),
            code: (props) => (
              <code
                className="bg-gray-100 text-sm px-1.5 py-0.5 rounded font-mono text-gray-700"
                {...props}
              />
            ),
            blockquote: (props) => (
              <blockquote
                className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-6"
                {...props}
              />
            ),
          }}
        >
          {data.summary}
        </Markdown>
      </div>
    </div>
  );
};

export default MeetingSummary;
