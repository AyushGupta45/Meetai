"use client";

import React from "react";
import { MeetingGetOne } from "../../types";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2Icon,
  CircleIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  ArrowDownIcon,
} from "lucide-react";

interface ActionItem {
  task: string;
  assignee: string;
  priority: "high" | "medium" | "low";
}

interface Props {
  data: MeetingGetOne;
}

const priorityConfig = {
  high: {
    icon: ArrowUpIcon,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    badge: "destructive" as const,
  },
  medium: {
    icon: ArrowRightIcon,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    badge: "secondary" as const,
  },
  low: {
    icon: ArrowDownIcon,
    color: "text-green-600",
    bg: "bg-green-50 border-green-200",
    badge: "outline" as const,
  },
};

const MeetingActionItems = ({ data }: Props) => {
  let actionItems: ActionItem[] = [];
  try {
    actionItems = JSON.parse(data.actionItems || "[]");
  } catch {
    actionItems = [];
  }

  if (actionItems.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2Icon className="size-10 text-muted-foreground mb-3" />
          <p className="text-lg font-medium">No Action Items</p>
          <p className="text-sm text-muted-foreground mt-1">
            No tasks or follow-ups were identified from this meeting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="px-2 pb-4">
        <p className="text-2xl font-medium">Action Items</p>
        <p className="text-sm text-muted-foreground mt-1">
          {actionItems.length} {actionItems.length === 1 ? "task" : "tasks"}{" "}
          identified
        </p>
      </div>

      <div className="space-y-2">
        {actionItems.map((item, idx) => {
          const config = priorityConfig[item.priority] || priorityConfig.medium;
          const PriorityIcon = config.icon;

          return (
            <div
              key={idx}
              className="flex items-start gap-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <CircleIcon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.task}</p>
                <div className="flex items-center gap-x-2 mt-1.5">
                  <Badge variant={config.badge} className="text-xs gap-1">
                    <PriorityIcon className="size-3" />
                    {item.priority}
                  </Badge>
                  {item.assignee && item.assignee !== "unassigned" && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.assignee}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MeetingActionItems;
