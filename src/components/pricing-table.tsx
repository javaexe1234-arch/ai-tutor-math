"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_FEATURES, PRICING } from "@/lib/plans";
import { cn } from "@/lib/utils";

export function PricingTable({ signedIn, pro }: { signedIn: boolean; pro: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function upgrade() {
    if (!signedIn) return router.push("/register?next=/pricing");
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Не удалось открыть оплату.");
      window.location.href = data.url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        <div className="flex flex-col rounded-3xl border bg-card p-7">
          <h3 className="text-4xl">Free</h3>
          <p className="mt-1 text-muted-foreground">Чтобы попробовать и заниматься понемногу</p>
          <p className="mt-6 text-4xl font-semibold">$0</p>
          <p className="text-sm text-muted-foreground">навсегда</p>
          <Features items={PLAN_FEATURES.free} />
          <Button asChild variant="outline" size="lg" className="mt-auto h-11">
            <Link href={signedIn ? "/dashboard" : "/register"}>{signedIn ? "К занятиям" : "Начать бесплатно"}</Link>
          </Button>
        </div>

        <div className="relative flex flex-col rounded-3xl border-2 border-[var(--pine)] bg-[var(--ink)] p-7 text-[var(--mist)]">
          <Badge className="absolute -top-3 right-6 bg-[var(--brick)] text-white">Рекомендуем</Badge>
          <h3 className="text-4xl text-[var(--mist)]">Pro</h3>
          <p className="mt-1 text-[var(--mist)]/70">Полноценный репетитор без ограничений</p>
          <p className="mt-6 text-4xl font-semibold">
            {PRICING.label} <span className="text-base font-normal text-[var(--mist)]/70">{PRICING.per}</span>
          </p>
          <p className="text-sm text-[var(--mist)]/70">оплата каждый месяц, отмена в любой момент</p>
          <Features items={PLAN_FEATURES.pro} dark />
          {pro ? (
            <Button asChild size="lg" className="mt-auto h-11 bg-[var(--sea)] text-[var(--ink)] hover:bg-[var(--sea)]/90">
              <Link href="/account">У вас Pro — управлять подпиской</Link>
            </Button>
          ) : (
            <Button size="lg" onClick={upgrade} disabled={busy} className="mt-auto h-11 bg-[var(--brick)] text-white hover:bg-[var(--brick)]/90">
              {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} Оформить Pro
            </Button>
          )}
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Оплата через Stripe. Отменить подписку можно в любой момент в личном кабинете.</p>
    </div>
  );
}

function Features({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <ul className="my-6 space-y-2.5">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm">
          <Check className={cn("mt-0.5 size-4 shrink-0", dark ? "text-[var(--sea)]" : "text-[var(--pine)]")} />
          {f}
        </li>
      ))}
    </ul>
  );
}
