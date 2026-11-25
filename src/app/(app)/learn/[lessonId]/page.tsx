import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { Quiz } from "@/components/quiz";
import { ProblemSet } from "@/components/problem-set";
import { TutorChat } from "@/components/tutor-chat";
import { UsageMeter } from "@/components/usage-meter";
import { getCurrentUser, getUsageState } from "@/lib/account";
import { ALL_LESSONS, canAccessLesson, findLesson } from "@/lib/curriculum";
import { isPro } from "@/lib/plans";

type Props = { params: Promise<{ lessonId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ref = findLesson((await params).lessonId);
  return { title: ref?.lesson.title ?? "Урок" };
}

export default async function LessonPage({ params }: Props) {
  const { lessonId } = await params;
  const ref = findLesson(lessonId);
  if (!ref) notFound();
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const pro = isPro(user);
  const { lesson, level, stage } = ref;

  const idx = ALL_LESSONS.findIndex((x) => x.lesson.id === lessonId);
  const prev = ALL_LESSONS[idx - 1];
  const next = ALL_LESSONS[idx + 1];

  if (!canAccessLesson(lessonId, pro)) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border bg-card p-8 text-center">
        <Lock className="mx-auto mb-3 size-10 text-[var(--brick)]" />
        <h1 className="text-4xl">{lesson.title}</h1>
        <p className="mt-2 text-muted-foreground">
          Урок этапа «{stage.title}» доступен в тарифе Pro. В Free открыты 5 уроков базовых тем.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href="/learn">К программе</Link>
          </Button>
          <Button asChild size="lg" className="bg-[var(--brick)] text-white hover:bg-[var(--brick)]/90">
            <Link href="/pricing">
              <Sparkles /> Открыть Pro
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const usage = await getUsageState(user);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="min-w-0 space-y-6">
        <div>
          <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground">
            ← {stage.title} · Уровень {level.number}: {level.title}
          </Link>
          <h1 className="mt-1 text-5xl">{lesson.title}</h1>
        </div>

        <article className="rounded-2xl border bg-card p-6">
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Теория</p>
          <Markdown className="text-base">{lesson.theory}</Markdown>
        </article>

        <Tabs defaultValue="quiz">
          <TabsList>
            <TabsTrigger value="quiz">Квиз</TabsTrigger>
            <TabsTrigger value="problems">Задачи</TabsTrigger>
          </TabsList>
          <TabsContent value="quiz" className="mt-4">
            <Quiz lessonId={lesson.id} />
          </TabsContent>
          <TabsContent value="problems" className="mt-4">
            <ProblemSet lessonId={lesson.id} pro={pro} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          {prev ? (
            <Button asChild variant="ghost">
              <Link href={`/learn/${prev.lesson.id}`}>
                <ChevronLeft /> {prev.lesson.title}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button asChild variant="ghost">
              <Link href={`/learn/${next.lesson.id}`}>
                {next.lesson.title} <ChevronRight />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)] lg:self-start">
        <UsageMeter initial={usage} track />
        <TutorChat
          lessonId={lesson.id}
          className="h-[520px] lg:h-[calc(100%-5.5rem)]"
          greeting={`Привет! Сегодня разбираем «${lesson.title}». Спросите, если что-то непонятно в теории, или попросите пример.`}
          suggestions={["Объясни проще", "Покажи пример", "Дай задачу потруднее"]}
        />
      </aside>
    </div>
  );
}
