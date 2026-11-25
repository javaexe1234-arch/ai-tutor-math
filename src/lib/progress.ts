import "server-only";
import { db } from "@/lib/db";
import { ALL_LESSONS, canAccessLesson, STAGES } from "@/lib/curriculum";

export type LessonStatus = "completed" | "started" | "new" | "locked";

export async function getProgress(userId: string, pro: boolean) {
  const rows = await db.lessonProgress.findMany({ where: { userId } });
  const byId = new Map(rows.map((r) => [r.lessonId, r]));

  const statusOf = (lessonId: string): LessonStatus => {
    if (!canAccessLesson(lessonId, pro)) return "locked";
    const row = byId.get(lessonId);
    if (!row) return "new";
    return row.status === "completed" ? "completed" : "started";
  };

  const stages = STAGES.map((s) => {
    const ids = s.levels.flatMap((l) => l.lessons.map((x) => x.id));
    const done = ids.filter((id) => statusOf(id) === "completed").length;
    return { id: s.id, title: s.title, total: ids.length, done };
  });

  const nextLesson =
    ALL_LESSONS.find((x) => statusOf(x.lesson.id) === "started") ??
    ALL_LESSONS.find((x) => statusOf(x.lesson.id) === "new");

  return { statusOf, scoreOf: (id: string) => byId.get(id)?.quizScore ?? null, stages, nextLesson };
}
