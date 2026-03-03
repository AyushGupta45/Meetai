import { z } from "zod";

export const CredentialInsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum([
    "OPENAI",
    "ANTHROPIC",
    "GEMINI",
    "GROQ",
    "OLLAMA",
    "OPENROUTER",
    "CUSTOM",
  ]),
  value: z.string().min(1, "API key is required"),
  metadata: z
    .object({
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    })
    .optional(),
});

export const CredentialUpdateSchema = z.object({
  id: z.string().min(1, { message: "Id is required" }),
  name: z.string().min(1).optional(),
  type: z
    .enum([
      "OPENAI",
      "ANTHROPIC",
      "GEMINI",
      "GROQ",
      "OLLAMA",
      "OPENROUTER",
      "CUSTOM",
    ])
    .optional(),
  value: z.string().min(1).optional(),
  metadata: z
    .object({
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    })
    .optional(),
});
