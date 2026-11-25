"use client";

import { useState } from "react";
import { Camera, CheckCircle2, Lightbulb, Loader2, Lock, RefreshCw, Sparkles, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown";
import { handleErrorResponse, isPlanError, postJson, requestUpgrade } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Problem = { question: string; answer: string; hint?: string };

type BasicResult = { mode: "basic"; isCorrect: boolean; expected?: string };
type AiResult = {
  mode: "ai";
  isCorrect: boolean;
  verdict: string;
  errorSteps: { step: string; problem: string; fix: string }[];
  explanation: string;
  similarProblem: { question: string; answer: string };
};

export function ProblemSet({ lessonId, topic, pro }: { lessonId?: string; topic?: string; pro: boolean }) {
  const [problems, setProblems] = useState<Problem[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await postJson<{ problems: Problem[] }>("/api/practice/generate", { lessonId, topic, kind: "problems" });
      setProblems(data.problems);
    } catch (e) {
      if (!isPlanError(e)) toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!problems) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-6 text-center">
        <p className="mb-4 text-muted-foreground">
          Решите задачи и введите ответ.{" "}
          {pro ? "Можно приложить решение — AI найдёт ошибки." : "В Pro репетитор проверит всё решение и разберёт ошибки."}
        </p>
        <Button size="lg" onClick={load} disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} Получить задачи
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {problems.map((p, i) => (
        <ProblemCard key={`${i}-${p.question}`} n={i + 1} problem={p} lessonId={lessonId} pro={pro} />
      ))}
      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Новые задачи
        </Button>
      </div>
    </div>
  );
}

function ProblemCard({ n, problem, lessonId, pro }: { n: number; problem: Problem; lessonId?: string; pro: boolean }) {
  const [answer, setAnswer] = useState("");
  const [solution, setSolution] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [busy, setBusy] = useState<"basic" | "ai" | null>(null);
  const [result, setResult] = useState<BasicResult | AiResult | null>(null);
  const [photo, setPhoto] = useState<{ key: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads/solution", { method: "POST", body });
      if (!res.ok) await handleErrorResponse(res);
      setPhoto(await res.json());
      setResult(null);
    } catch (e) {
      if (!isPlanError(e)) toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function check(mode: "basic" | "ai") {
    if (mode === "ai" && !pro) {
      requestUpgrade({ kind: "pro", message: "Проверка решений и разбор ошибок доступны в тарифе Pro." });
      return;
    }
    if (mode === "basic" && !answer.trim()) return toast.info("Введите ответ.");
    if (mode === "ai" && !solution.trim() && !photo) return toast.info("Опишите решение по шагам или прикрепите фото.");
    setBusy(mode);
    try {
      const res = await postJson<BasicResult | AiResult>("/api/practice/check", {
        lessonId,
        problem: problem.question,
        expected: problem.answer,
        answer: answer.trim(),
        solution: mode === "ai" ? solution : undefined,
        imageKey: mode === "ai" ? photo?.key : undefined,
      });
      setResult(res);
    } catch (e) {
      if (!isPlanError(e)) toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold">{n}</span>
        <Markdown className="flex-1 text-base">{problem.question}</Markdown>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && check("basic")}
          placeholder="Ваш ответ (например 42 или 3/4)"
          className="h-10"
          aria-label={`Ответ на задачу ${n}`}
        />
        <Button size="lg" className="h-10" onClick={() => check("basic")} disabled={busy !== null}>
          {busy === "basic" && <Loader2 className="animate-spin" />} Проверить ответ
        </Button>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 flex items-center gap-2 text-sm font-medium" htmlFor={`sol-${n}`}>
          Решение по шагам {!pro && <Badge variant="outline" className="gap-1"><Lock className="size-3" /> Pro</Badge>}
        </label>
        <Textarea
          id={`sol-${n}`}
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          placeholder={pro ? "Запишите, как вы решали — репетитор найдёт, где ошибка" : "Доступно в Pro: AI проверит решение и разберёт ошибки"}
          rows={3}
          disabled={!pro}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant={pro ? "secondary" : "outline"} onClick={() => check("ai")} disabled={busy !== null}>
            {busy === "ai" ? <Loader2 className="animate-spin" /> : <Sparkles />} Проверить решение с разбором
          </Button>
          {pro ? (
            <Button variant="outline" asChild disabled={uploading}>
              <label className="cursor-pointer">
                {uploading ? <Loader2 className="animate-spin" /> : <Camera />} Фото решения
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPhoto(f);
                    e.target.value = "";
                  }}
                />
              </label>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => requestUpgrade({ kind: "pro", message: "Проверка решения по фото доступна в тарифе Pro." })}
            >
              <Camera /> Фото решения
            </Button>
          )}
          {problem.hint && (
            <Button variant="ghost" onClick={() => setShowHint((s) => !s)}>
              <Lightbulb /> Подсказка
            </Button>
          )}
        </div>
        {photo && (
          <div className="relative mt-3 w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element -- presigned Object Storage URL */}
            <img src={photo.url} alt="Фото вашего решения" className="max-h-56 rounded-xl border" />
            <button
              onClick={() => setPhoto(null)}
              className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-background/90 shadow"
              aria-label="Убрать фото"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        {showHint && problem.hint && <Markdown className="mt-2 rounded-xl bg-muted p-3 text-sm">{problem.hint}</Markdown>}
      </div>

      {result && <ResultView result={result} />}
    </div>
  );
}

function ResultView({ result }: { result: BasicResult | AiResult }) {
  const ok = result.isCorrect;
  return (
    <div
      className={cn(
        "mt-4 rounded-xl border p-4 text-sm",
        ok ? "border-[var(--sea)] bg-[var(--sea)]/10" : "border-destructive/40 bg-destructive/5",
      )}
      role="status"
    >
      <p className="flex items-center gap-2 font-semibold">
        {ok ? <CheckCircle2 className="size-5 text-[var(--pine)]" /> : <XCircle className="size-5 text-destructive" />}
        {result.mode === "ai" ? result.verdict : ok ? "Верно!" : "Пока неверно — попробуйте ещё раз или спросите репетитора."}
      </p>
      {result.mode === "basic" && !ok && result.expected && (
        <p className="mt-1 text-muted-foreground">Правильный ответ: {result.expected}</p>
      )}
      {result.mode === "ai" && (
        <div className="mt-3 space-y-3">
          {result.errorSteps.length > 0 && (
            <div>
              <p className="mb-1 font-semibold">Разбор ошибок</p>
              <ul className="space-y-2">
                {result.errorSteps.map((s, i) => (
                  <li key={i} className="rounded-lg bg-background p-3">
                    <Markdown className="text-muted-foreground">{`**Шаг:** ${s.step}`}</Markdown>
                    <Markdown>{`**Ошибка:** ${s.problem}`}</Markdown>
                    <Markdown>{`**Как правильно:** ${s.fix}`}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <p className="mb-1 font-semibold">Решение</p>
            <Markdown>{result.explanation}</Markdown>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="mb-1 font-semibold">Закрепим: похожая задача</p>
            <Markdown>{result.similarProblem.question}</Markdown>
            <details className="mt-1 text-muted-foreground">
              <summary className="cursor-pointer">Показать ответ</summary>
              <Markdown>{result.similarProblem.answer}</Markdown>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
