import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRightIcon,
  TrashIcon,
  PencilIcon,
  MoreVerticalIcon,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface Props {
  meetingId: string;
  meetingName: string;
  onEdit: () => void;
  onRemove: () => void;
  canEdit: boolean;
  canMarkAsCompleted: boolean;
  onMarkAsCompleted: () => void;
}
const MeetingIdViewHeader = ({
  meetingId,
  meetingName,
  onEdit,
  onRemove,
  canEdit,
  canMarkAsCompleted,
  onMarkAsCompleted,
}: Props) => {
  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild className="font-medium text-lg sm:text-xl">
              <Link href="/meetings">My Meetings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-foreground text-xl font-medium [&>svg]:size-4">
            <ChevronRightIcon />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="font-medium text-lg sm:text-xl text-foreground"
            >
              <Link href={`/agents/${meetingId}`}>{meetingName}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {canEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon className="size-4 text-black" />
              Edit
            </DropdownMenuItem>
          )}
          {canMarkAsCompleted && (
            <DropdownMenuItem onClick={onMarkAsCompleted}>
              <CheckCircle className="size-4 text-black" />
              Mark as Completed
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onRemove}>
            <TrashIcon className="size-4 text-black" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MeetingIdViewHeader;
