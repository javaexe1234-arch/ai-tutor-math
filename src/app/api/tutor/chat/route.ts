import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, guardPractice } from "@/lib/api";
import { tutorChatStream } from "@/lib/ai/tutor";

const schema = z.object({
  lessonId: z.string().nullish(),
  messages: z
    .array(z.object({ role: z.enum(["user", "model"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(40),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("BAD_REQUEST", "Некорректный запрос.");
  const { lessonId, messages } = parsed.data;
  if (messages.at(-1)?.role !== "user") return apiError("BAD_REQUEST", "Последнее сообщение должно быть от ученика.");

  const g = await guardPractice(lessonId);
  if (!g.ok) return g.res;

  let stream: Awaited<ReturnType<typeof tutorChatStream>>;
  try {
    stream = await tutorChatStream(messages.slice(-20), g.ctx);
  } catch (e) {
    console.error("tutor chat failed", e);
    return apiError("AI_ERROR", "Репетитор временно недоступен. Попробуйте ещё раз.");
  }

  const encoder = new TextEncoder();
  const userId = g.user.id;
  const question = messages.at(-1)!.content;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        for (let attempt = 1; ; attempt++) {
          try {
            for await (const chunk of stream) {
              const text = chunk.text ?? "";
              if (text) {
                full += text;
                controller.enqueue(encoder.encode(text));
              }
            }
            break;
          } catch (e) {
            // Nothing sent yet (e.g. 503 "high demand" on the first chunk) — start the stream again once.
            if (full || attempt >= 2) throw e;
            console.warn("tutor stream failed before first chunk, retrying", e);
            stream = await tutorChatStream(messages.slice(-20), g.ctx);
          }
        }
      } catch (e) {
        console.error("tutor stream error", e);
        controller.enqueue(encoder.encode("\n\n_Связь с репетитором прервалась. Попробуйте ещё раз._"));
      } finally {
        // Save before closing so the conversation is stored by the time the client sees the end.
        if (full) {
          await db.chatMessage
            .createMany({
              data: [
                { userId, lessonId: lessonId ?? null, role: "user", content: question },
                { userId, lessonId: lessonId ?? null, role: "model", content: full },
              ],
            })
            .catch((e) => console.error("save chat failed", e));
        }
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
