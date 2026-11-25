"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/markdown";
import { isPlanError, postJson } from "@/lib/client-api";
import { PASS_SCORE } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Question = { question: string; options: string[]; answer: string };

export function Quiz({ lessonId, topic }: { lessonId?: string; topic?: string }) {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const data = await postJson<{ questions: Question[] }>("/api/practice/generate", { lessonId, topic, kind: "quiz" });
      setQuestions(data.questions);
      setIndex(0);
      setPicked(null);
      setCorrect(0);
      setDone(false);
    } catch (e) {
      if (!isPlanError(e)) toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function next() {
    if (!questions) return;
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setDone(true);
    const score = Math.round((correct / questions.length) * 100);
    if (lessonId) {
      await postJson("/api/progress", { lessonId, quizScore: score }).catch(() => undefined);
    }
  }

  if (!questions) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
        <p className="mb-4 text-muted-foreground">5 вопросов с вариантами ответа. Наберите {PASS_SCORE}% и больше, чтобы пройти урок.</p>
        <Button size="lg" onClick={start} disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Начать квиз
        </Button>
      </div>
    );
  }

  if (done) {
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= PASS_SCORE;
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <Trophy className={cn("mx-auto mb-2 size-10", passed ? "text-[var(--sea)]" : "text-muted-foreground")} />
        <p className="font-heading text-4xl">{passed ? "Урок пройден!" : "Почти получилось"}</p>
        <p className="mt-1 text-muted-foreground">
          Правильно {correct} из {questions.length} ({score}%)
        </p>
        <Button className="mt-4" variant="outline" size="lg" onClick={start} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <RotateCcw />} Новый квиз
        </Button>
      </div>
    );
  }

  const q = questions[index];
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Вопрос {index + 1} из {questions.length}
        </span>
        <span>Верно: {correct}</span>
      </div>
      <Progress value={(index / questions.length) * 100} className="mb-4 h-1.5" />
      <Markdown className="mb-4 text-lg">{q.question}</Markdown>
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          return (
            <button
              key={opt}
              disabled={picked !== null}
              onClick={() => {
                setPicked(opt);
                if (isAnswer) setCorrect((c) => c + 1);
              }}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors",
                picked === null && "hover:border-[var(--sea)] hover:bg-muted",
                picked !== null && isAnswer && "border-[var(--sea)] bg-[var(--sea)]/15",
                isPicked && !isAnswer && "border-destructive bg-destructive/10",
              )}
            >
              <Markdown>{opt}</Markdown>
              {picked !== null && isAnswer && <CheckCircle2 className="size-5 text-[var(--pine)]" />}
              {isPicked && !isAnswer && <XCircle className="size-5 text-destructive" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 flex justify-end">
          <Button size="lg" onClick={next}>
            {index + 1 < questions.length ? "Дальше" : "Завершить"}
          </Button>
        </div>
      )}
    </div>
  );
}
