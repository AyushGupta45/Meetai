"use client";

import React, { useState } from "react";
import { Button } from "../../../../components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { DEFAULT_PAGE } from "@/module/meetings/constants";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { useMeetingsFilters } from "../../hooks/use-meetings-filter";
import { MeetingsSearchFilter } from "./meetings-search-filters";
import { MeetingsStatusFilter } from "./meeting-status-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const MeetingsListHeader = () => {
  const [filters, setFilters] = useMeetingsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isAnyFilterModified =
    !!filters.search || !!filters.status || !!filters.agentId;

  const onClearFilters = () => {
    setFilters({
      status: null,
      agentId: "",
      search: "",
      page: DEFAULT_PAGE,
    });
  };

  return (
    <>
      <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-lg sm:text-xl">My Meetings</h5>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon />
            New Meeting
          </Button>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <MeetingsSearchFilter />
            <MeetingsStatusFilter />
            <AgentIdFilter />
            {isAnyFilterModified && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <XCircleIcon />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};

export default MeetingsListHeader;
