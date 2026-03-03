"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVerticalIcon,
  PencilIcon,
  TrashIcon,
  ZapIcon,
  KeyIcon,
} from "lucide-react";
import { CredentialTypeConfig } from "../../types";
import type { CredentialMetadata } from "../../types";
import { format } from "date-fns";
import { useState } from "react";
import { UpdateCredentialDialog } from "./update-credential-dialog";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";

interface CredentialRow {
  id: string;
  name: string;
  type: string;
  metadata: CredentialMetadata | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

function ActionsCell({ row }: { row: CredentialRow }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [updateOpen, setUpdateOpen] = useState(false);

  const testConnection = useMutation(
    trpc.credentials.testConnection.mutationOptions({
      onSuccess: (result) => {
        if (result.success) {
          toast.success(result.message);
        } else {
          toast.error(`Connection failed: ${result.message}`);
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const removeCredential = useMutation(
    trpc.credentials.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        toast.success("Credential deleted");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Delete Credential",
    "Are you sure you want to delete this credential? Any features using it will stop working.",
  );

  const handleDelete = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeCredential.mutateAsync({ id: row.id });
  };

  return (
    <>
      <RemoveConfirmation />
      <UpdateCredentialDialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        initialValues={{
          id: row.id,
          name: row.name,
          type: row.type as keyof typeof CredentialTypeConfig,
          metadata: row.metadata,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => testConnection.mutate({ id: row.id })}
            disabled={testConnection.isPending}
          >
            <ZapIcon className="size-4" />
            {testConnection.isPending ? "Testing..." : "Test Connection"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete}>
            <TrashIcon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export const columns: ColumnDef<CredentialRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-x-2">
        <KeyIcon className="size-4 text-muted-foreground" />
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Provider",
    cell: ({ row }) => {
      const config =
        CredentialTypeConfig[
          row.original.type as keyof typeof CredentialTypeConfig
        ];
      return (
        <Badge variant="outline" className="capitalize">
          {config?.label || row.original.type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => {
      const metadata = row.original.metadata;
      const config =
        CredentialTypeConfig[
          row.original.type as keyof typeof CredentialTypeConfig
        ];
      const model = metadata?.model || config?.defaultModel;
      return (
        <span className="text-sm text-muted-foreground">{model || "—"}</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(row.original.createdAt, "MMM d, yyyy")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row.original} />,
  },
];
