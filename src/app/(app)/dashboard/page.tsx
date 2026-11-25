import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Dumbbell, Lock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { UsageMeter } from "@/components/usage-meter";
import { getCurrentUser, getUsageState } from "@/lib/account";
import { getProgress } from "@/lib/progress";
import { db } from "@/lib/db";
import { isPro } from "@/lib/plans";

export const metadata: Metadata = { title: "Обзор" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pro = isPro(user);
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [usage, progress, attempts] = await Promise.all([
    getUsageState(user),
    getProgress(user.id, pro),
    db.attempt.groupBy({ by: ["isCorrect"], where: { userId: user.id, createdAt: { gte: since } }, _count: true }),
  ]);
  const solved = attempts.reduce((s, a) => s + a._count, 0);
  const right = attempts.find((a) => a.isCorrect)?._count ?? 0;
  const next = progress.nextLesson;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-5xl">Привет, {user.name ?? "ученик"}!</h1>
          <p className="mt-1 text-muted-foreground">Немного математики каждый день — и результат не заставит себя ждать.</p>
        </div>
        <UsageMeter initial={usage} className="sm:w-80" />
      </div>

      {next && (
        <div className="flex flex-col gap-4 rounded-3xl bg-[var(--ink)] p-6 text-[var(--mist)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[var(--mist)]/70">
              {next.stage.title} · Уровень {next.level.number}: {next.level.title}
            </p>
            <p className="font-heading text-4xl">{next.lesson.title}</p>
          </div>
          <Button asChild size="lg" className="h-11 bg-[var(--sea)] text-[var(--ink)] hover:bg-[var(--sea)]/90">
            <Link href={`/learn/${next.lesson.id}`}>
              Продолжить <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={BookOpen} label="Уроков пройдено" value={progress.stages.reduce((s, x) => s + x.done, 0)} />
        <Stat icon={Dumbbell} label="Задач за 7 дней" value={solved} />
        <Stat icon={Target} label="Точность за 7 дней" value={solved ? `${Math.round((right / solved) * 100)}%` : "—"} />
      </div>

      <section>
        <h2 className="mb-4 text-4xl">Этапы обучения</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {progress.stages.map((s) => {
            const locked = !pro && s.id !== "beginner";
            return (
              <Link
                key={s.id}
                href={`/learn#${s.id}`}
                className="rounded-2xl border bg-card p-5 transition-colors hover:border-[var(--sea)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-3xl">{s.title}</span>
                  {locked && <Lock className="size-4 text-muted-foreground" aria-label="Доступно в Pro" />}
                </div>
                <Progress value={(s.done / s.total) * 100} className="mt-4 h-2" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {s.done} из {s.total} уроков{locked ? " · Pro" : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <Icon className="mb-3 size-5 text-[var(--pine)] dark:text-[var(--sea)]" />
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
