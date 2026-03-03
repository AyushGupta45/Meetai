import "server-only";
import {
  getUserFirstCredential,
  getDecryptedCredentialById,
} from "@/module/credentials/server/credential-queries";
import { CredentialTypeConfig } from "@/module/credentials/types";
import { AIError } from "./types";
import type {
  AIProviderConfig,
  AIRequestOptions,
  AINormalizedResponse,
  AIStreamResponse,
} from "./types";
import { callProvider, callProviderStream } from "./providers";

/**
 * Resolve a user's credential into an AIProviderConfig.
 * If credentialId is given, uses that specific credential.
 * Otherwise, falls back to the user's first/default credential.
 */
export async function resolveCredential(
  userId: string,
  credentialId?: string,
): Promise<AIProviderConfig> {
  const cred = credentialId
    ? await getDecryptedCredentialById(credentialId, userId)
    : await getUserFirstCredential(userId);

  if (!cred) {
    throw new AIError(
      "No API credentials configured. Please add a credential in Settings → Credentials.",
      401,
      "NONE",
    );
  }

  const config = CredentialTypeConfig[cred.type];

  return {
    type: cred.type,
    apiKey: cred.value,
    baseUrl: cred.metadata?.baseUrl || config?.defaultBaseUrl,
    model: cred.metadata?.model || config?.defaultModel,
  };
}

/**
 * Main entry point: resolve credential and call provider.
 */
export async function callLLM(
  userId: string,
  options: AIRequestOptions,
  credentialId?: string,
): Promise<AINormalizedResponse> {
  const providerConfig = await resolveCredential(userId, credentialId);
  return callProvider(providerConfig, options);
}

/**
 * Main entry point for streaming: resolve credential and call provider stream.
 */
export async function callLLMStream(
  userId: string,
  options: AIRequestOptions,
  credentialId?: string,
): Promise<AIStreamResponse> {
  const providerConfig = await resolveCredential(userId, credentialId);
  return callProviderStream(providerConfig, options);
}
