import type { Metadata } from "next";
import { PricingTable } from "@/components/pricing-table";
import { getCurrentUser } from "@/lib/account";
import { isPro } from "@/lib/plans";

export const metadata: Metadata = { title: "Тарифы" };

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-center text-6xl">Тарифы</h1>
      <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-muted-foreground">
        Начните бесплатно. Переходите на Pro, когда захотите заниматься без ограничений и получать разбор ошибок.
      </p>
      {sp.checkout === "cancelled" && (
        <p className="mx-auto mb-6 max-w-md rounded-xl border bg-card p-3 text-center text-sm">Оплата отменена — ничего не списано.</p>
      )}
      <PricingTable signedIn={!!user} pro={isPro(user)} />
    </section>
  );
}
