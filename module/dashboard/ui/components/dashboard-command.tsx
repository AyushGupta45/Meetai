import {
  CommandResponsiveDialog,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import React, { Dispatch, SetStateAction } from "react";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const DashboardCommand = ({ open, setOpen }: Props) => {
  return (
    <CommandResponsiveDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Find a meeting or agent" />
      <CommandItem>Test</CommandItem>
    </CommandResponsiveDialog>
  );
};

export default DashboardCommand;
