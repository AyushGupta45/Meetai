import "server-only";
import {
  AIError,
  type AINormalizedResponse,
  type AIProviderConfig,
  type AIRequestOptions,
  type AIStreamResponse,
} from "./types";
import { CredentialTypeConfig } from "@/module/credentials/types";

// ─── OpenAI-compatible providers (OpenAI, Groq, OpenRouter, Ollama, Custom) ───

function buildOpenAIHeaders(apiKey: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

async function callOpenAICompatible(
  config: AIProviderConfig,
  options: AIRequestOptions,
  stream: boolean,
): Promise<Response> {
  const baseUrl =
    config.baseUrl ||
    CredentialTypeConfig[config.type as keyof typeof CredentialTypeConfig]
      ?.defaultBaseUrl ||
    "https://api.openai.com/v1";

  const model =
    options.model ||
    config.model ||
    CredentialTypeConfig[config.type as keyof typeof CredentialTypeConfig]
      ?.defaultModel ||
    "gpt-4o";

  const endpoint = `${baseUrl}/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: buildOpenAIHeaders(config.apiKey),
    body: JSON.stringify({
      model,
      messages: options.messages,
      stream,
      ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
      ...(options.temperature !== undefined
        ? { temperature: options.temperature }
        : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AIError(
      `${config.type} API error: ${body}`,
      res.status,
      config.type,
    );
  }

  return res;
}

function parseOpenAIResponse(
  json: Record<string, unknown>,
): AINormalizedResponse {
  const choices = json.choices as Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  return {
    content: choices?.[0]?.message?.content ?? "",
    model: (json.model as string) ?? "unknown",
    finishReason: choices?.[0]?.finish_reason ?? null,
  };
}

// ─── Anthropic ───

async function callAnthropic(
  config: AIProviderConfig,
  options: AIRequestOptions,
  stream: boolean,
): Promise<Response> {
  const baseUrl =
    config.baseUrl ||
    CredentialTypeConfig.ANTHROPIC.defaultBaseUrl ||
    "https://api.anthropic.com/v1";

  const model =
    options.model ||
    config.model ||
    CredentialTypeConfig.ANTHROPIC.defaultModel!;

  // Anthropic uses a separate system parameter
  const systemMsg = options.messages.find((m) => m.role === "system");
  const nonSystemMessages = options.messages.filter((m) => m.role !== "system");

  const res = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 1024,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: nonSystemMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      stream,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AIError(`Anthropic API error: ${body}`, res.status, "ANTHROPIC");
  }

  return res;
}

function parseAnthropicResponse(
  json: Record<string, unknown>,
): AINormalizedResponse {
  const content = json.content as Array<{ text?: string; type: string }>;
  return {
    content:
      content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text)
        .join("") ?? "",
    model: (json.model as string) ?? "unknown",
    finishReason: (json.stop_reason as string) ?? null,
  };
}

// ─── Gemini ───

async function callGemini(
  config: AIProviderConfig,
  options: AIRequestOptions,
): Promise<Response> {
  const baseUrl =
    config.baseUrl ||
    CredentialTypeConfig.GEMINI.defaultBaseUrl ||
    "https://generativelanguage.googleapis.com/v1beta";

  const model =
    options.model || config.model || CredentialTypeConfig.GEMINI.defaultModel!;

  // Convert messages to Gemini format
  const systemMsg = options.messages.find((m) => m.role === "system");
  const userMessages = options.messages.filter((m) => m.role !== "system");

  const contents = userMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = { contents };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }
  if (options.maxTokens) {
    body.generationConfig = { maxOutputTokens: options.maxTokens };
  }

  const res = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const respBody = await res.text();
    throw new AIError(`Gemini API error: ${respBody}`, res.status, "GEMINI");
  }

  return res;
}

function parseGeminiResponse(
  json: Record<string, unknown>,
): AINormalizedResponse {
  const candidates = json.candidates as Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  return {
    content: candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "",
    model: "gemini",
    finishReason: candidates?.[0]?.finishReason ?? null,
  };
}

// ─── Streaming helpers ───

function openAIStreamToReadableStream(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

function anthropicStreamToReadableStream(
  body: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                controller.enqueue(encoder.encode(parsed.delta.text));
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

// ─── Public API ───

/**
 * Call an AI provider with the given config and options.
 * Returns a normalized response.
 */
export async function callProvider(
  config: AIProviderConfig,
  options: AIRequestOptions,
): Promise<AINormalizedResponse> {
  switch (config.type) {
    case "OPENAI":
    case "GROQ":
    case "OPENROUTER":
    case "OLLAMA":
    case "CUSTOM": {
      const res = await callOpenAICompatible(config, options, false);
      const json = await res.json();
      return parseOpenAIResponse(json);
    }
    case "ANTHROPIC": {
      const res = await callAnthropic(config, options, false);
      const json = await res.json();
      return parseAnthropicResponse(json);
    }
    case "GEMINI": {
      const res = await callGemini(config, options);
      const json = await res.json();
      return parseGeminiResponse(json);
    }
    default:
      throw new AIError(
        `Unsupported provider: ${config.type}`,
        400,
        config.type,
      );
  }
}

/**
 * Call an AI provider with streaming. Returns a ReadableStream of text chunks.
 */
export async function callProviderStream(
  config: AIProviderConfig,
  options: AIRequestOptions,
): Promise<AIStreamResponse> {
  switch (config.type) {
    case "OPENAI":
    case "GROQ":
    case "OPENROUTER":
    case "OLLAMA":
    case "CUSTOM": {
      const res = await callOpenAICompatible(config, options, true);
      if (!res.body)
        throw new AIError("No response body for stream", 500, config.type);
      return { stream: openAIStreamToReadableStream(res.body) };
    }
    case "ANTHROPIC": {
      const res = await callAnthropic(config, options, true);
      if (!res.body)
        throw new AIError("No response body for stream", 500, "ANTHROPIC");
      return { stream: anthropicStreamToReadableStream(res.body) };
    }
    case "GEMINI": {
      // Gemini doesn't have a standard SSE stream - use non-streaming and wrap
      const res = await callGemini(config, options);
      const json = await res.json();
      const parsed = parseGeminiResponse(json);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(parsed.content));
          controller.close();
        },
      });
      return { stream };
    }
    default:
      throw new AIError(
        `Unsupported provider: ${config.type}`,
        400,
        config.type,
      );
  }
}
