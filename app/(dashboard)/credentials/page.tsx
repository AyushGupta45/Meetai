"use client";

import { Suspense } from "react";
import {
  CredentialsView,
  CredentialsViewError,
  CredentialsViewLoading,
} from "@/module/credentials/ui/views/credentials-views";
import CredentialsViewHeader from "@/module/credentials/ui/components/credentials-view-header";
import { ErrorBoundary } from "react-error-boundary";

const CredentialsPage = () => {
  return (
    <>
      <CredentialsViewHeader />
      <Suspense fallback={<CredentialsViewLoading />}>
        <ErrorBoundary fallback={<CredentialsViewError />}>
          <CredentialsView />
        </ErrorBoundary>
      </Suspense>
    </>
  );
};

export default CredentialsPage;
