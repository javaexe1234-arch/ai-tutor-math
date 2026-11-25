import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, hasPracticeTime, type CurrentUser, type UsageState } from "@/lib/account";
import { canAccessLesson, findLesson, type LessonRef } from "@/lib/curriculum";
import { isPro } from "@/lib/plans";

export type ApiErrorCode = "UNAUTHORIZED" | "LIMIT_REACHED" | "PRO_REQUIRED" | "NOT_FOUND" | "BAD_REQUEST" | "AI_ERROR";

export function apiError(code: ApiErrorCode, message: string, extra?: Record<string, unknown>) {
  const status = { UNAUTHORIZED: 401, LIMIT_REACHED: 402, PRO_REQUIRED: 403, NOT_FOUND: 404, BAD_REQUEST: 400, AI_ERROR: 502 }[code];
  return NextResponse.json({ error: message, code, ...extra }, { status });
}

type Guarded =
  | { ok: true; user: CurrentUser; pro: boolean; usage: UsageState; ctx?: LessonRef }
  | { ok: false; res: NextResponse };

/** Auth + plan + daily-limit + lesson-access checks shared by all practice endpoints. */
export async function guardPractice(lessonId?: string | null): Promise<Guarded> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, res: apiError("UNAUTHORIZED", "Войдите в аккаунт.") };
  const pro = isPro(user);

  let ctx: LessonRef | undefined;
  if (lessonId) {
    ctx = findLesson(lessonId);
    if (!ctx) return { ok: false, res: apiError("NOT_FOUND", "Урок не найден.") };
    if (!canAccessLesson(lessonId, pro)) {
      return { ok: false, res: apiError("PRO_REQUIRED", "Этот урок доступен в тарифе Pro.") };
    }
  }

  const { ok, usage } = await hasPracticeTime(user);
  if (!ok) {
    return {
      ok: false,
      res: apiError("LIMIT_REACHED", "Бесплатные 10 минут на сегодня закончились.", { resetAt: usage.resetAt }),
    };
  }
  return { ok: true, user, pro, usage, ctx };
}
