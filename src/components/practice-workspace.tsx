"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Quiz } from "@/components/quiz";
import { ProblemSet } from "@/components/problem-set";
import { FREE_TOPICS, PRO_TOPICS } from "@/lib/topics";
import { requestUpgrade } from "@/lib/client-api";
import { cn } from "@/lib/utils";

export function PracticeWorkspace({ pro }: { pro: boolean }) {
  const [topic, setTopic] = useState<string>(FREE_TOPICS[0]);
  const [custom, setCustom] = useState("");
  const active = pro && custom.trim() ? custom.trim() : topic;

  const choose = (t: string, locked: boolean) => {
    if (locked) return requestUpgrade({ kind: "pro", message: "Эта тема доступна в тарифе Pro." });
    setCustom("");
    setTopic(t);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5">
        <p className="mb-3 text-sm font-medium">Тема практики</p>
        <div className="flex flex-wrap gap-2">
          {[...FREE_TOPICS.map((t) => [t, false] as const), ...PRO_TOPICS.map((t) => [t, !pro] as const)].map(([t, locked]) => (
            <button
              key={t}
              onClick={() => choose(t, locked)}
              aria-pressed={active === t}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                active === t ? "border-[var(--pine)] bg-[var(--pine)] text-[var(--mist)]" : "hover:bg-muted",
                locked && "text-muted-foreground",
              )}
            >
              {locked && <Lock className="size-3" />} {t}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <Input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onFocus={() => !pro && requestUpgrade({ kind: "pro", message: "Свои темы практики доступны в тарифе Pro." })}
            readOnly={!pro}
            placeholder={pro ? "Или впишите свою тему, например «логарифмы»" : "Своя тема — в Pro"}
            className="h-10"
            aria-label="Своя тема"
          />
        </div>
      </div>

      <Tabs defaultValue="problems" key={active}>
        <TabsList>
          <TabsTrigger value="problems">Задачи</TabsTrigger>
          <TabsTrigger value="quiz">Квиз</TabsTrigger>
        </TabsList>
        <TabsContent value="problems" className="mt-4">
          <ProblemSet topic={active} pro={pro} />
        </TabsContent>
        <TabsContent value="quiz" className="mt-4">
          <Quiz topic={active} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
