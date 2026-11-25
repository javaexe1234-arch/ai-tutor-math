"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UPGRADE_EVENT, type UpgradeReason } from "@/lib/client-api";
import { useCountdown } from "@/components/use-countdown";

export function UpgradeDialogHost() {
  const [reason, setReason] = useState<UpgradeReason | null>(null);

  useEffect(() => {
    const onEvent = (e: Event) => setReason((e as CustomEvent<UpgradeReason>).detail);
    window.addEventListener(UPGRADE_EVENT, onEvent);
    return () => window.removeEventListener(UPGRADE_EVENT, onEvent);
  }, []);

  return (
    <Dialog open={!!reason} onOpenChange={(o) => !o && setReason(null)}>
      <DialogContent className="sm:max-w-md">
        {reason?.kind === "limit" ? <LimitBody resetAt={reason.resetAt} /> : <ProBody message={reason?.message} />}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" onClick={() => setReason(null)}>
            Позже
          </Button>
          <Button asChild size="lg" className="bg-[var(--brick)] text-white hover:bg-[var(--brick)]/90">
            <Link href="/pricing" onClick={() => setReason(null)}>
              <Sparkles /> Перейти на Pro
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LimitBody({ resetAt }: { resetAt?: string }) {
  const left = useCountdown(resetAt);
  return (
    <DialogHeader>
      <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-muted text-primary">
        <Clock />
      </div>
      <DialogTitle className="text-center text-3xl">Время на сегодня вышло</DialogTitle>
      <DialogDescription className="text-center">
        Бесплатные 10 минут практики закончились. Новые минуты появятся в 12:00 по вашему времени
        {left ? ` — через ${left}` : ""}. С Pro можно заниматься без ограничений.
      </DialogDescription>
    </DialogHeader>
  );
}

function ProBody({ message }: { message?: string }) {
  return (
    <DialogHeader>
      <div className="mx-auto mb-2 grid size-12 place-items-center rounded-full bg-muted text-[var(--brick)]">
        <Sparkles />
      </div>
      <DialogTitle className="text-center text-3xl">Доступно в Pro</DialogTitle>
      <DialogDescription className="text-center">
        {message ?? "Эта возможность входит в тариф Pro."} Pro открывает все этапы, проверку решений и разбор ошибок.
      </DialogDescription>
    </DialogHeader>
  );
}
