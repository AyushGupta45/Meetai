import { ResponsiveDialog } from "@/components/responsive-dialog";
import { CredentialForm } from "./credential-form";
import type { CredentialMetadata } from "../../types";

interface UpdateCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: {
    id: string;
    name: string;
    type: string;
    metadata: CredentialMetadata | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
}

export const UpdateCredentialDialog = ({
  open,
  onOpenChange,
  initialValues,
}: UpdateCredentialDialogProps) => {
  return (
    <ResponsiveDialog
      title="Edit Credential"
      description="Update your credential. Leave the API key blank to keep the current value."
      open={open}
      onOpenChange={onOpenChange}
    >
      <CredentialForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
        initialValues={initialValues}
      />
    </ResponsiveDialog>
  );
};
