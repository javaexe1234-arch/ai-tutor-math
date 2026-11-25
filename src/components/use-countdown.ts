"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/usage";

/** Live "h:mm:ss" countdown to an ISO instant; null until mounted or when no target. */
export function useCountdown(targetIso?: string | null): string | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!targetIso) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetIso]);
  if (!targetIso || now === null) return null;
  return formatDuration((new Date(targetIso).getTime() - now) / 1000);
}
