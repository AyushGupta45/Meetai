import "server-only";
import { db } from "@/db";
import { credentials } from "@/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { encryptCredential, decryptCredential } from "../lib/encryption";
import { TRPCError } from "@trpc/server";
import { CredentialTypeConfig } from "../types";
import type { CredentialMetadata } from "../types";

export async function getManyCredentials(
  userId: string,
  page: number,
  pageSize: number,
) {
  const data = await db
    .select({
      id: credentials.id,
      name: credentials.name,
      type: credentials.type,
      metadata: credentials.metadata,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    })
    .from(credentials)
    .where(eq(credentials.userId, userId))
    .orderBy(desc(credentials.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [total] = await db
    .select({ count: count() })
    .from(credentials)
    .where(eq(credentials.userId, userId));

  const totalPages = Math.ceil(total.count / pageSize);

  return {
    items: data.map((c) => ({
      ...c,
      metadata: (c.metadata as CredentialMetadata | null) ?? null,
    })),
    total: total.count,
    totalPages,
  };
}

export async function getCredentialById(id: string, userId: string) {
  const [cred] = await db
    .select({
      id: credentials.id,
      name: credentials.name,
      type: credentials.type,
      metadata: credentials.metadata,
      createdAt: credentials.createdAt,
      updatedAt: credentials.updatedAt,
    })
    .from(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.userId, userId)));

  if (!cred) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
  }

  return {
    ...cred,
    metadata: (cred.metadata as CredentialMetadata | null) ?? null,
  };
}

export async function getAllCredentials(userId: string) {
  const data = await db
    .select({
      id: credentials.id,
      name: credentials.name,
      type: credentials.type,
    })
    .from(credentials)
    .where(eq(credentials.userId, userId))
    .orderBy(desc(credentials.createdAt));

  return data;
}

export async function getDecryptedCredentialById(id: string, userId: string) {
  const [cred] = await db
    .select()
    .from(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.userId, userId)));

  if (!cred) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
  }

  return {
    id: cred.id,
    name: cred.name,
    type: cred.type,
    value: decryptCredential(cred.value),
    metadata: (cred.metadata as CredentialMetadata | null) ?? null,
    createdAt: cred.createdAt,
    updatedAt: cred.updatedAt,
  };
}

export async function getUserFirstCredential(userId: string) {
  const [cred] = await db
    .select()
    .from(credentials)
    .where(eq(credentials.userId, userId))
    .orderBy(desc(credentials.createdAt))
    .limit(1);

  if (!cred) {
    return null;
  }

  return {
    id: cred.id,
    name: cred.name,
    type: cred.type,
    value: decryptCredential(cred.value),
    metadata: (cred.metadata as CredentialMetadata | null) ?? null,
  };
}

export async function hasAnyCredentials(userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(credentials)
    .where(eq(credentials.userId, userId));

  return result.count > 0;
}

export async function createCredential(
  input: {
    name: string;
    type: string;
    value: string;
    metadata?: { baseUrl?: string; model?: string };
  },
  userId: string,
) {
  const encryptedValue = encryptCredential(input.value);

  const [created] = await db
    .insert(credentials)
    .values({
      userId,
      name: input.name,
      type: input.type as typeof credentials.$inferInsert.type,
      value: encryptedValue,
      metadata: input.metadata ?? null,
    })
    .returning({
      id: credentials.id,
      name: credentials.name,
      type: credentials.type,
    });

  return created;
}

export async function updateCredential(
  input: {
    id: string;
    name?: string;
    type?: string;
    value?: string;
    metadata?: { baseUrl?: string; model?: string };
  },
  userId: string,
) {
  const updates: Record<string, unknown> = {};

  if (input.name) updates.name = input.name;
  if (input.type) updates.type = input.type;
  if (input.value) updates.value = encryptCredential(input.value);
  if (input.metadata !== undefined) {
    updates.metadata = input.metadata ?? null;
  }

  const [updated] = await db
    .update(credentials)
    .set(updates)
    .where(and(eq(credentials.id, input.id), eq(credentials.userId, userId)))
    .returning({
      id: credentials.id,
      name: credentials.name,
      type: credentials.type,
    });

  if (!updated) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
  }

  return updated;
}

export async function removeCredential(id: string, userId: string) {
  const [removed] = await db
    .delete(credentials)
    .where(and(eq(credentials.id, id), eq(credentials.userId, userId)))
    .returning({
      id: credentials.id,
      name: credentials.name,
    });

  if (!removed) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
  }

  return removed;
}

export async function testCredentialConnection(id: string, userId: string) {
  const cred = await getDecryptedCredentialById(id, userId);
  const config = CredentialTypeConfig[cred.type];
  const baseUrl = cred.metadata?.baseUrl || config.defaultBaseUrl;
  const model = cred.metadata?.model || config.defaultModel;

  try {
    switch (cred.type) {
      case "OPENAI":
      case "GROQ":
      case "OPENROUTER": {
        const url = `${baseUrl}/models`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${cred.value}` },
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`API returned ${res.status}: ${body}`);
        }
        return { success: true, message: "Connection successful" };
      }
      case "OLLAMA": {
        const ollamaUrl = (baseUrl || "http://localhost:11434/api").replace(
          /\/v1$/,
          "",
        );
        const res = await fetch(`${ollamaUrl}/tags`);
        if (!res.ok) {
          throw new Error(`Ollama returned ${res.status}`);
        }
        return { success: true, message: "Connection successful" };
      }
      case "ANTHROPIC": {
        const res = await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": cred.value,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: model || "claude-3-5-sonnet-20241022",
            max_tokens: 1,
            messages: [{ role: "user", content: "Hi" }],
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Anthropic returned ${res.status}: ${body}`);
        }
        return { success: true, message: "Connection successful" };
      }
      case "GEMINI": {
        const m = model || "gemini-2.0-flash-exp";
        const res = await fetch(
          `${baseUrl}/models/${m}:generateContent?key=${cred.value}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Hi" }] }],
            }),
          },
        );
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Gemini returned ${res.status}: ${body}`);
        }
        return { success: true, message: "Connection successful" };
      }
      case "CUSTOM": {
        if (!baseUrl) {
          throw new Error("Base URL is required for custom provider");
        }
        const endpoint = baseUrl.endsWith("/chat/completions")
          ? baseUrl
          : `${baseUrl}/chat/completions`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cred.value}`,
          },
          body: JSON.stringify({
            model: model || "gpt-3.5-turbo",
            messages: [{ role: "user", content: "Hi" }],
            max_tokens: 1,
          }),
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(`Custom provider returned ${res.status}: ${body}`);
        }
        return { success: true, message: "Connection successful" };
      }
      default:
        throw new Error(`Unsupported provider type: ${cred.type}`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, message };
  }
}
