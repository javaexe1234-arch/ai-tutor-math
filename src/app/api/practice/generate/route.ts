import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, guardPractice } from "@/lib/api";
import { toMultipleChoice } from "@/lib/curriculum";
import { generateProblems, generateQuiz } from "@/lib/ai/tutor";
import { isFreeTopic } from "@/lib/topics";

const schema = z.object({
  lessonId: z.string().nullish(),
  topic: z.string().max(200).optional(),
  kind: z.enum(["quiz", "problems"]),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", "Некорректный запрос.");
  const { lessonId, topic, kind } = parsed.data;

  const g = await guardPractice(lessonId);
  if (!g.ok) return g.res;

  if (!lessonId && !g.pro && !isFreeTopic(topic)) {
    return apiError("PRO_REQUIRED", "Эта тема доступна в тарифе Pro.");
  }

  const gen = g.ctx?.lesson.gen;
  try {
    if (kind === "quiz") {
      // Locally generated lessons give instant quizzes; others ask the AI.
      const questions = gen
        ? Array.from({ length: 5 }, () => toMultipleChoice(gen()))
        : await generateQuiz(g.ctx, topic, 5);
      return NextResponse.json({ questions });
    }
    const problems = gen ? Array.from({ length: 3 }, () => gen()) : await generateProblems(g.ctx, topic, 3);
    return NextResponse.json({ problems });
  } catch (e) {
    console.error("generate failed", e);
    return apiError("AI_ERROR", "Не удалось составить задания. Попробуйте ещё раз.");
  }
}
