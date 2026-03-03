import { ResponsiveDialog } from "@/components/responsive-dialog";
import { CredentialForm } from "./credential-form";

interface NewCredentialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewCredentialDialog = ({
  open,
  onOpenChange,
}: NewCredentialDialogProps) => {
  return (
    <ResponsiveDialog
      title="Add Credential"
      description="Add a new API credential. Your key will be encrypted before storage."
      open={open}
      onOpenChange={onOpenChange}
    >
      <CredentialForm
        onSuccess={() => onOpenChange(false)}
        onCancel={() => onOpenChange(false)}
      />
    </ResponsiveDialog>
  );
};
