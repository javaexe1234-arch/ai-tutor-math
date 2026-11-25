import "server-only";
import { GoogleGenAI } from "@google/genai";

export const MODEL = "gemini-3.5-flash-lite";

let client: GoogleGenAI | null = null;

export function gemini(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

function isTransient(e: unknown): boolean {
  const status = (e as { status?: number })?.status;
  return status === 429 || status === 500 || status === 503 || status === 504;
}

/** Retry temporary Gemini errors ("model is experiencing high demand", rate limits) with backoff. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= attempts || !isTransient(e)) throw e;
      await new Promise((r) => setTimeout(r, 600 * 2 ** (i - 1) + Math.random() * 300));
    }
  }
}
