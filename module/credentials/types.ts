import { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

export const CredentialType = {
  OPENAI: "OPENAI",
  ANTHROPIC: "ANTHROPIC",
  GEMINI: "GEMINI",
  GROQ: "GROQ",
  OLLAMA: "OLLAMA",
  OPENROUTER: "OPENROUTER",
  CUSTOM: "CUSTOM",
} as const;

export type CredentialType =
  (typeof CredentialType)[keyof typeof CredentialType];

export interface CredentialTypeConfigItem {
  label: string;
  placeholder: string;
  requiresBaseUrl: boolean;
  defaultBaseUrl?: string;
  defaultModel?: string;
}

export const CredentialTypeConfig: Record<
  CredentialType,
  CredentialTypeConfigItem
> = {
  OPENAI: {
    label: "OpenAI",
    placeholder: "sk-...",
    requiresBaseUrl: false,
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  ANTHROPIC: {
    label: "Anthropic (Claude)",
    placeholder: "sk-ant-...",
    requiresBaseUrl: false,
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  GEMINI: {
    label: "Gemini",
    placeholder: "AIza...",
    requiresBaseUrl: false,
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash-exp",
  },
  GROQ: {
    label: "Groq",
    placeholder: "gsk_...",
    requiresBaseUrl: false,
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  OLLAMA: {
    label: "Ollama (Local)",
    placeholder: "Not required for Ollama",
    requiresBaseUrl: true,
    defaultBaseUrl: "http://localhost:11434/api",
    defaultModel: "llama2",
  },
  OPENROUTER: {
    label: "OpenRouter",
    placeholder: "sk-or-...",
    requiresBaseUrl: false,
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-3.5-turbo",
  },
  CUSTOM: {
    label: "Custom Provider",
    placeholder: "API key or token",
    requiresBaseUrl: true,
    defaultBaseUrl: undefined,
    defaultModel: undefined,
  },
};

export interface CredentialMetadata {
  baseUrl?: string;
  model?: string;
}

export type CredentialGetOne =
  inferRouterOutputs<AppRouter>["credentials"]["getOne"];
export type CredentialGetMany =
  inferRouterOutputs<AppRouter>["credentials"]["getMany"]["items"];
