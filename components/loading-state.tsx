import { Loader2Icon } from "lucide-react";
import React from "react";

interface Props {
  title: string;
  description: string;
}

const LoadingState = ({ title, description }: Props) => {
  return (

    <div style={{ height: "calc(100vh - 64px)" }} className="py-4 px-8 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-y-6 bg-background rounded-lg p-10 shadow-sm">
        <Loader2Icon className="size-6 animate-spin text-primary" />
        <div className="flex flex-col gap-y-2 text-center">
          <h1 className="text-lg font-medium">{title}</h1>
          <p className="text-sm">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
