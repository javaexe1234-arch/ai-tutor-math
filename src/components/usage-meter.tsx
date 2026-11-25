"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Infinity as InfinityIcon, Timer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { requestUpgrade } from "@/lib/client-api";
import { formatDuration } from "@/lib/usage";
import { useCountdown } from "@/components/use-countdown";
import type { UsageState } from "@/lib/account";
import { cn } from "@/lib/utils";

const HEARTBEAT_MS = 15_000;

/**
 * Shows today's remaining Free minutes. With `track`, counts the time the
 * page is visible as practice and reports it to the server every 15 s.
 */
export function UsageMeter({ initial, track = false, className }: { initial: UsageState; track?: boolean; className?: string }) {
  const [usage, setUsage] = useState(initial);
  const [localRemaining, setLocalRemaining] = useState(initial.remainingSeconds);
  const warned = useRef(false);
  const resetIn = useCountdown(usage.resetAt);

  // Server heartbeat
  useEffect(() => {
    if (!track || usage.pro) return;
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      const res = await fetch("/api/usage/heartbeat", { method: "POST" }).catch(() => null);
      if (!res?.ok) return;
      const next: UsageState = await res.json();
      setUsage(next);
      setLocalRemaining(next.remainingSeconds);
    };
    const t = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [track, usage.pro]);

  // Smooth local countdown between heartbeats
  useEffect(() => {
    if (!track || usage.pro) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setLocalRemaining((s) => (s === null ? s : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [track, usage.pro]);

  useEffect(() => {
    if (track && localRemaining === 0 && !warned.current) {
      warned.current = true;
      requestUpgrade({ kind: "limit", resetAt: usage.resetAt });
    }
  }, [track, localRemaining, usage.resetAt]);

  if (usage.pro) {
    return (
      <div className={cn("flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm", className)}>
        <InfinityIcon className="size-4 text-[var(--brick)]" />
        <span>Pro: время без ограничений</span>
      </div>
    );
  }

  const limit = usage.limitSeconds ?? 1;
  const left = localRemaining ?? 0;
  return (
    <div className={cn("rounded-xl border bg-card px-3 py-2 text-sm", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5">
          <Timer className="size-4 text-primary" />
          {left > 0 ? (
            <>
              Осталось сегодня: <b className="tabular-nums">{formatDuration(left)}</b>
            </>
          ) : (
            <>Лимит исчерпан</>
          )}
        </span>
        <Link href="/pricing" className="text-xs text-[var(--brick)] underline-offset-2 hover:underline">
          Без лимита
        </Link>
      </div>
      <Progress value={(left / limit) * 100} className="mt-2 h-1.5" aria-label="Оставшееся время практики" />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Сброс в 12:00 ({usage.timezone}){resetIn ? ` · через ${resetIn}` : ""}
      </p>
    </div>
  );
}
