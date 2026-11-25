"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/markdown";
import { ApiError, handleErrorResponse, isPlanError } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "model"; content: string };

export function TutorChat({
  lessonId,
  greeting,
  suggestions = [],
  className,
}: {
  lessonId?: string;
  greeting: string;
  suggestions?: string[];
  className?: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const history: Msg[] = [...messages, { role: "user", content }];
    setMessages([...history, { role: "model", content: "" }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, messages: history }),
      });
      if (!res.ok || !res.body) await handleErrorResponse(res);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "model", content: acc }]);
      }
    } catch (e) {
      setMessages(history.slice(0, -1));
      setInput(content);
      if (!isPlanError(e)) toast.error(e instanceof ApiError ? e.message : "Не удалось связаться с репетитором.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex min-h-0 flex-col rounded-2xl border bg-card", className)}>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <span className="grid size-8 place-items-center rounded-full bg-[var(--pine)] text-sm text-[var(--mist)]">AI</span>
        <div>
          <p className="text-sm font-semibold leading-tight">Репетитор</p>
          <p className="text-xs text-muted-foreground">Подсказывает, а не решает за вас</p>
        </div>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        <Bubble role="model">{greeting}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content || "…"}
          </Bubble>
        ))}
        {messages.length === 0 && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border bg-background px-3 py-1 text-left text-xs hover:border-[var(--sea)] hover:bg-muted"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Спросите репетитора… (Enter — отправить)"
          rows={2}
          className="max-h-40 min-h-11 resize-none"
          aria-label="Сообщение репетитору"
        />
        <Button type="submit" size="icon-lg" disabled={busy || !input.trim()} aria-label="Отправить">
          {busy ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </form>
    </div>
  );
}

function Bubble({ role, children }: { role: Msg["role"]; children: string }) {
  return (
    <div className={cn("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2 text-sm",
          role === "user" ? "rounded-br-sm bg-[var(--pine)] text-[var(--mist)]" : "rounded-bl-sm bg-muted",
        )}
      >
        {role === "user" ? <p className="whitespace-pre-wrap">{children}</p> : <Markdown>{children}</Markdown>}
      </div>
    </div>
  );
}
