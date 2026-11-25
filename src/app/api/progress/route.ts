import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/account";
import { apiError } from "@/lib/api";
import { canAccessLesson, findLesson } from "@/lib/curriculum";
import { isPro, PASS_SCORE } from "@/lib/plans";

const schema = z.object({ lessonId: z.string(), quizScore: z.number().int().min(0).max(100) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Войдите в аккаунт.");
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !findLesson(parsed.data.lessonId)) return apiError("BAD_REQUEST", "Некорректный запрос.");
  const { lessonId, quizScore } = parsed.data;
  if (!canAccessLesson(lessonId, isPro(user))) return apiError("PRO_REQUIRED", "Урок доступен в Pro.");

  const prev = await db.lessonProgress.findUnique({ where: { userId_lessonId: { userId: user.id, lessonId } } });
  const best = Math.max(prev?.quizScore ?? 0, quizScore);
  const passed = best >= PASS_SCORE;
  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, quizScore: best, status: passed ? "completed" : "started", completedAt: passed ? new Date() : null },
    update: {
      quizScore: best,
      status: passed ? "completed" : "started",
      completedAt: passed ? (prev?.completedAt ?? new Date()) : null,
    },
  });
  return NextResponse.json({ quizScore: best, passed });
}
