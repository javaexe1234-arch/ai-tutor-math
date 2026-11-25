import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleDashed, CircleDot, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/account";
import { getProgress, type LessonStatus } from "@/lib/progress";
import { STAGES } from "@/lib/curriculum";
import { isPro } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Уроки" };

const ICON: Record<LessonStatus, React.ElementType> = {
  completed: CheckCircle2,
  started: CircleDot,
  new: CircleDashed,
  locked: Lock,
};

export default async function LearnPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pro = isPro(user);
  const { statusOf, scoreOf } = await getProgress(user.id, pro);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-5xl">Программа обучения</h1>
        <p className="mt-1 text-muted-foreground">
          {pro
            ? "Все этапы открыты. Проходите уроки по порядку или выбирайте нужную тему."
            : "В тарифе Free открыты 5 уроков базовых тем, включая умножение и деление. Остальное — в Pro."}
        </p>
      </div>

      {STAGES.map((stage, si) => (
        <section key={stage.id} id={stage.id} className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-baseline gap-3">
            <h2 className="text-4xl">
              {si + 1}. {stage.title}
            </h2>
            <span className="text-sm text-muted-foreground">{stage.subtitle}</span>
            {!pro && si > 0 && <Badge className="bg-[var(--brick)] text-white">Pro</Badge>}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stage.levels.map((level) => (
              <div key={level.number} className="rounded-2xl border bg-card p-5">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Уровень {level.number}</p>
                <p className="text-lg font-semibold">{level.title}</p>
                <p className="mb-3 text-sm text-muted-foreground">{level.description}</p>
                <ul className="space-y-1">
                  {level.lessons.map((lesson) => {
                    const status = statusOf(lesson.id);
                    const Icon = ICON[status];
                    const score = scoreOf(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={status === "locked" ? "/pricing" : `/learn/${lesson.id}`}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted",
                            status === "locked" && "text-muted-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4 shrink-0",
                              status === "completed" && "text-[var(--pine)] dark:text-[var(--sea)]",
                              status === "started" && "text-[var(--sea)]",
                            )}
                            aria-hidden
                          />
                          <span className="flex-1">{lesson.title}</span>
                          {!pro && lesson.free && <Badge variant="outline">Free</Badge>}
                          {score !== null && <span className="text-xs tabular-nums text-muted-foreground">{score}%</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
