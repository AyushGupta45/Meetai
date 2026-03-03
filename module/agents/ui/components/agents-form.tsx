import { AgentGetOne } from "@/module/agents/types";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { agentsInsertSchema, type AgentsInsert } from "../../schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AGENT_TEMPLATES, DEFAULT_VOICE_ID } from "../../constants";
import { Card } from "@/components/ui/card";
import { twMerge } from "tailwind-merge";
import { PlayIcon, StopCircleIcon, KeyIcon } from "lucide-react";
import { useSpeech } from "@/module/call/components/speech-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { speak, stop, isSpeaking: isPreviewPlaying, voices } = useSpeech();

  const { data: credentialsList } = useSuspenseQuery(
    trpc.credentials.getAll.queryOptions(),
  );

  const createAgent = useMutation(
    trpc.agents.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({}),
        );

        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateAgent = useMutation(
    trpc.agents.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.agents.getMany.queryOptions({}),
        );

        if (initialValues?.id) {
          await queryClient.invalidateQueries(
            trpc.agents.getOne.queryOptions({ id: initialValues.id }),
          );
        }
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<AgentsInsert>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
      credentialId: initialValues?.credentialId ?? "",
      voiceId: initialValues?.voiceId ?? DEFAULT_VOICE_ID,
      template: initialValues?.template ?? undefined,
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = (values: AgentsInsert) => {
    if (isEdit) {
      updateAgent.mutate({ ...values, id: initialValues.id });
    } else {
      createAgent.mutate(values);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;

    form.setValue("template", templateId);

    if (template.id !== "custom") {
      form.setValue("name", template.title);
      form.setValue("instructions", template.instructions);
    }
  };

  const handleVoicePreview = () => {
    if (isPreviewPlaying) {
      stop();
      return;
    }
    const voiceId = form.getValues("voiceId");
    speak(
      "Hello! This is a preview of how I will sound during your meetings.",
      voiceId,
    );
  };

  const selectedTemplate = form.watch("template");

  return (
    <Form {...form}>
      <ScrollArea className="max-h-[70vh]">
        <form className="space-y-4 px-1" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Template Selector — only show when creating */}
          {!isEdit && (
            <div className="space-y-2">
              <FormLabel>Template</FormLabel>
              <div className="grid grid-cols-2 gap-2">
                {AGENT_TEMPLATES.map((template) => (
                  <Card
                    key={template.id}
                    className={twMerge(
                      "cursor-pointer p-2.5 transition-colors hover:bg-muted",
                      selectedTemplate === template.id &&
                        "border-primary bg-muted",
                    )}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <p className="text-xs font-medium leading-tight">
                      {template.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {template.description}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <GeneratedAvatar
            seed={form.watch("name")}
            variant="botttsNeutral"
            className="border size-16"
          />

          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g. Physics teacher" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="instructions"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="E.g. You are a helpful physics assistant that can answer questions and help with assignments"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Credential Selector */}
          <FormField
            name="credentialId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credential</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a credential" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {credentialsList.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        <div className="flex items-center gap-x-2">
                          <KeyIcon className="size-3 text-muted-foreground" />
                          <span>{cred.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({cred.type})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Voice with Preview */}
          <FormField
            name="voiceId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voice</FormLabel>
                <div className="flex gap-x-2">
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {voices.length === 0 && (
                        <SelectItem value="" disabled>
                          No voices available
                        </SelectItem>
                      )}
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={handleVoicePreview}
                  >
                    {isPreviewPlaying ? (
                      <StopCircleIcon className="size-4" />
                    ) : (
                      <PlayIcon className="size-4" />
                    )}
                  </Button>
                </div>
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
      </ScrollArea>
    </Form>
  );
};
