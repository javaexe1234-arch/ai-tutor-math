import "server-only";
import { z } from "zod";
import { gemini, MODEL, withRetry } from "./gemini";
import { CHECK_SYSTEM, generationPrompt, tutorSystemPrompt } from "./prompts";
import type { LessonRef } from "@/lib/curriculum";

export type ChatTurn = { role: "user" | "model"; content: string };

export async function tutorChatStream(history: ChatTurn[], ctx?: LessonRef) {
  return withRetry(() =>
    gemini().models.generateContentStream({
      model: MODEL,
      contents: history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
      config: { systemInstruction: tutorSystemPrompt(ctx), temperature: 0.6 },
    }),
  );
}

type Image = { bytes: Uint8Array; contentType: string };

async function generateJson<T>(schema: z.ZodType<T>, prompt: string, system: string, image?: Image): Promise<T> {
  const contents = image
    ? [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: image.contentType, data: Buffer.from(image.bytes).toString("base64") } },
            { text: prompt },
          ],
        },
      ]
    : prompt;
  const res = await withRetry(() =>
    gemini().models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(schema),
        temperature: 0.8,
      },
    }),
  );
  return schema.parse(JSON.parse(res.text ?? "null"));
}

export const QuizSchema = z.object({
  questions: z
    .array(z.object({ question: z.string(), options: z.array(z.string()).length(4), answer: z.string() }))
    .min(1),
});

export const ProblemsSchema = z.object({
  problems: z.array(z.object({ question: z.string(), answer: z.string(), hint: z.string() })).min(1),
});

export const CheckSchema = z.object({
  isCorrect: z.boolean(),
  verdict: z.string().describe("Одно короткое предложение: верно или нет и почему"),
  errorSteps: z
    .array(z.object({ step: z.string(), problem: z.string(), fix: z.string() }))
    .describe("Ошибочные шаги ученика; пустой массив, если ошибок нет"),
  explanation: z.string().describe("Разбор правильного решения по шагам, markdown + LaTeX"),
  similarProblem: z.object({ question: z.string(), answer: z.string() }),
});
export type CheckResult = z.infer<typeof CheckSchema>;

export async function generateQuiz(ctx: LessonRef | undefined, topic?: string, count = 5) {
  const out = await generateJson(QuizSchema, generationPrompt(ctx, topic, "quiz", count), tutorSystemPrompt(ctx));
  return out.questions.filter((q) => q.options.includes(q.answer));
}

export async function generateProblems(ctx: LessonRef | undefined, topic?: string, count = 3) {
  const out = await generateJson(ProblemsSchema, generationPrompt(ctx, topic, "problems", count), tutorSystemPrompt(ctx));
  return out.problems;
}

/** Pro: AI check of a full solution with step-by-step error analysis. */
export async function checkSolution(args: {
  problem: string;
  expected?: string;
  solution: string;
  image?: Image;
  ctx?: LessonRef;
}) {
  const prompt = `Задача: ${args.problem}
${args.expected ? `Эталонный ответ: ${args.expected}\n` : ""}${args.image ? "Решение ученика — на прикреплённом фото (рукописное). Сначала аккуратно перепиши шаги с фото, затем проверь.\n" : ""}${args.solution ? `Решение ученика (текст):\n${args.solution}` : ""}`;
  return generateJson(CheckSchema, prompt, `${CHECK_SYSTEM}\n${args.ctx ? `Урок: «${args.ctx.lesson.title}».` : ""}`, args.image);
}
