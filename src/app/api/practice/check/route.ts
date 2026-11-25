import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, guardPractice } from "@/lib/api";
import { checkAnswer } from "@/lib/curriculum";
import { checkSolution } from "@/lib/ai/tutor";
import { ownsSolutionImage, readSolutionImage } from "@/lib/storage";

const schema = z.object({
  lessonId: z.string().nullish(),
  problem: z.string().min(1).max(2000),
  expected: z.string().max(200).optional(),
  answer: z.string().max(200).default(""),
  /** Full worked solution — analysed by AI on the Pro plan. */
  solution: z.string().max(4000).optional(),
  /** Object Storage key of an uploaded photo of the solution (Pro). */
  imageKey: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", "Некорректный запрос.");
  const { lessonId, problem, expected, answer, solution, imageKey } = parsed.data;

  const g = await guardPractice(lessonId);
  if (!g.ok) return g.res;

  const wantsAi = !!solution?.trim() || !!imageKey;
  if (wantsAi && !g.pro) {
    return apiError("PRO_REQUIRED", "Проверка решений и разбор ошибок доступны в тарифе Pro.");
  }

  if (!wantsAi) {
    if (!expected) return apiError("BAD_REQUEST", "Нет эталонного ответа для автопроверки.");
    const isCorrect = checkAnswer(answer, expected);
    await db.attempt.create({
      data: { userId: g.user.id, lessonId: lessonId ?? null, problem, answer, isCorrect },
    });
    return NextResponse.json({ mode: "basic", isCorrect, expected: isCorrect ? undefined : g.pro ? expected : undefined });
  }

  if (imageKey && !ownsSolutionImage(g.user.id, imageKey)) {
    return apiError("BAD_REQUEST", "Фото не найдено.");
  }

  try {
    const image = imageKey ? await readSolutionImage(imageKey) : undefined;
    const text = [solution?.trim(), answer ? `Ответ: ${answer}` : ""].filter(Boolean).join("\n");
    const result = await checkSolution({ problem, expected, solution: text, image, ctx: g.ctx });
    // When a reference answer exists, trust arithmetic over the model for the final verdict.
    if (expected && answer) result.isCorrect = checkAnswer(answer, expected);
    await db.attempt.create({
      data: {
        userId: g.user.id,
        lessonId: lessonId ?? null,
        problem,
        answer: answer || (solution ?? "").slice(0, 200) || "(фото)",
        isCorrect: result.isCorrect,
        feedback: result,
        imageKey: imageKey ?? null,
      },
    });
    return NextResponse.json({ mode: "ai", ...result });
  } catch (e) {
    console.error("check failed", e);
    return apiError("AI_ERROR", "Не удалось проверить решение. Попробуйте ещё раз.");
  }
}
