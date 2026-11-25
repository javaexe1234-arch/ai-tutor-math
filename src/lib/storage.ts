import "server-only";
import { randomUUID } from "crypto";
import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

/**
 * Neon Object Storage (bucket "uploads", declared in neon.ts).
 * Credentials, endpoint and region come from the AWS_* vars that `neon deploy` pulls.
 */
export const UPLOADS_BUCKET = "uploads";

let files: Files | null = null;
function bucket(): Files {
  // Locally the adapter reads the AWS_* vars from `neon env pull`. Hosts that reserve AWS_* names
  // (e.g. Vercel) set the same values as NEON_STORAGE_* instead.
  const e = process.env;
  const explicit =
    e.NEON_STORAGE_ACCESS_KEY_ID && e.NEON_STORAGE_SECRET_ACCESS_KEY
      ? { accessKeyId: e.NEON_STORAGE_ACCESS_KEY_ID, secretAccessKey: e.NEON_STORAGE_SECRET_ACCESS_KEY }
      : {};
  files ??= new Files({
    adapter: neon({
      bucket: UPLOADS_BUCKET,
      endpoint: e.NEON_STORAGE_ENDPOINT || undefined,
      region: e.NEON_STORAGE_REGION || undefined,
      ...explicit,
    }),
  });
  return files;
}

export const SOLUTION_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;
export const SOLUTION_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };

const solutionPrefix = (userId: string) => `solutions/${userId}/`;

/** Store a photo of a handwritten solution and return its object key. */
export async function saveSolutionImage(userId: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const key = `${solutionPrefix(userId)}${randomUUID()}.${EXT[contentType] ?? "bin"}`;
  await bucket().upload(key, bytes, { contentType });
  return key;
}

/** True only for keys inside this user's own folder. */
export function ownsSolutionImage(userId: string, key: string): boolean {
  return key.startsWith(solutionPrefix(userId)) && !key.includes("..");
}

export async function readSolutionImage(key: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const file = await bucket().download(key);
  return { bytes: new Uint8Array(await file.arrayBuffer()), contentType: file.type || "image/jpeg" };
}

/** Short-lived presigned GET link for showing the photo back to its owner. */
export async function solutionImageUrl(key: string): Promise<string> {
  return bucket().url(key, { expiresIn: 3600 });
}
