"use client";

import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  CredentialType,
  CredentialTypeConfig,
  type CredentialMetadata,
} from "../../types";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.nativeEnum(CredentialType),
  value: z.string().optional(),
  baseUrl: z.string().optional(),
  model: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CredentialFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    name: string;
    type: string;
    metadata: CredentialMetadata | null;
    createdAt: string | Date;
    updatedAt: string | Date;
  };
}

export const CredentialForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: CredentialFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [showValue, setShowValue] = useState(false);

  const isEdit = !!initialValues?.id;

  const createCredential = useMutation(
    trpc.credentials.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        toast.success("Credential created successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateCredential = useMutation(
    trpc.credentials.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.credentials.getMany.queryOptions({}),
        );
        toast.success("Credential updated successfully!");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      type: (initialValues?.type as CredentialType) ?? CredentialType.OPENAI,
      value: "",
      baseUrl: initialValues?.metadata?.baseUrl ?? "",
      model: initialValues?.metadata?.model ?? "",
    },
  });

  const selectedType = form.watch("type");
  const typeConfig = CredentialTypeConfig[selectedType];

  const isPending = createCredential.isPending || updateCredential.isPending;

  const onSubmit = (values: FormValues) => {
    if (!isEdit && selectedType !== CredentialType.OLLAMA && !values.value) {
      toast.error("API key is required");
      return;
    }

    const apiKey =
      selectedType === CredentialType.OLLAMA && !values.value
        ? "not-required-for-ollama"
        : values.value;

    const metadata: CredentialMetadata = {};
    if (values.baseUrl) metadata.baseUrl = values.baseUrl;
    if (values.model) metadata.model = values.model;

    if (isEdit) {
      updateCredential.mutate({
        id: initialValues!.id,
        name: values.name,
        type: values.type,
        ...(apiKey ? { value: apiKey } : {}),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    } else {
      createCredential.mutate({
        name: values.name,
        type: values.type,
        value: apiKey || "",
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="My API Key" {...field} />
              </FormControl>
              <FormDescription>
                A friendly label to identify this credential
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="type"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(CredentialTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedType !== CredentialType.OLLAMA && (
          <FormField
            name="value"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  API Key {isEdit && "(leave blank to keep current)"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showValue ? "text" : "password"}
                      placeholder={typeConfig?.placeholder || "Enter API key"}
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowValue(!showValue)}
                    >
                      {showValue ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {(typeConfig?.requiresBaseUrl ||
          selectedType === CredentialType.OLLAMA ||
          selectedType === CredentialType.CUSTOM) && (
          <FormField
            name="baseUrl"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder={typeConfig?.defaultBaseUrl || "https://..."}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {typeConfig?.defaultBaseUrl
                    ? `Default: ${typeConfig.defaultBaseUrl}`
                    : "The API base URL for this provider"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          name="model"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    typeConfig?.defaultModel || "e.g. gpt-4o, llama-3.3-70b"
                  }
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {typeConfig?.defaultModel
                  ? `Default: ${typeConfig.defaultModel}`
                  : "The model to use with this provider"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="outline"
              disabled={isPending}
              type="button"
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
