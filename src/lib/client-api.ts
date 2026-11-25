"use client";

export type UpgradeReason = { kind: "limit"; resetAt?: string } | { kind: "pro"; message?: string };

export const UPGRADE_EVENT = "mathmentor:upgrade";

export function requestUpgrade(reason: UpgradeReason) {
  window.dispatchEvent(new CustomEvent<UpgradeReason>(UPGRADE_EVENT, { detail: reason }));
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

/** Inspect an error response: plan/limit errors open the upgrade dialog. */
export async function handleErrorResponse(res: Response): Promise<never> {
  const data = await res.json().catch(() => ({}));
  if (data.code === "LIMIT_REACHED") requestUpgrade({ kind: "limit", resetAt: data.resetAt });
  if (data.code === "PRO_REQUIRED") requestUpgrade({ kind: "pro", message: data.error });
  throw new ApiError(data.error ?? "Что-то пошло не так.", res.status, data.code);
}

export async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) return handleErrorResponse(res);
  return res.json();
}

/** True for errors already explained to the user by the upgrade dialog. */
export function isPlanError(e: unknown) {
  return e instanceof ApiError && (e.code === "LIMIT_REACHED" || e.code === "PRO_REQUIRED");
}
