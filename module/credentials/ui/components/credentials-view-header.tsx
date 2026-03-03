"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, ShieldCheck, ShieldCheckIcon } from "lucide-react";
import { NewCredentialDialog } from "./new-credential-dialog";
import { Card, CardContent } from "@/components/ui/card";

const CredentialsViewHeader = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <NewCredentialDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-lg sm:text-xl">API Credentials</h5>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon />
            Add Credential
          </Button>
        </div>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-start gap-4">
              <div className="rounded-full bg-green-500/10 p-3 shrink-0">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">
                  Your credentials are secure
                </h3>
                <p className="text-xs text-muted-foreground text-start">
                  All credentials are encrypted using industry-standard AES-256
                  encryption and stored securely. Your sensitive information is
                  protected and never exposed in plain text.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CredentialsViewHeader;
