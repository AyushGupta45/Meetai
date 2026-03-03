/**
 * Centralized AI provider types used throughout the application.
 */

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  model?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface AINormalizedResponse {
  content: string;
  model: string;
  finishReason: string | null;
}

export interface AIStreamResponse {
  stream: ReadableStream<Uint8Array>;
}

export interface AIProviderConfig {
  type: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export class AIError extends Error {
  public readonly statusCode: number;
  public readonly provider: string;

  constructor(message: string, statusCode: number, provider: string) {
    super(message);
    this.name = "AIError";
    this.statusCode = statusCode;
    this.provider = provider;
  }
}
