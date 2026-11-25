import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ManageSubscriptionButton } from "@/components/billing-buttons";
import { UsageMeter } from "@/components/usage-meter";
import { getCurrentUser, getUsageState } from "@/lib/account";
import { isPro, PLAN_FEATURES } from "@/lib/plans";

export const metadata: Metadata = { title: "Аккаунт" };

const STATUS: Record<string, string> = {
  active: "активна",
  trialing: "пробный период",
  past_due: "ожидает оплаты",
  canceled: "отменена",
  unpaid: "не оплачена",
  incomplete: "не завершена",
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);
  if (!user) redirect("/login");
  const pro = isPro(user);
  const usage = await getUsageState(user);
  const periodEnd = user.currentPeriodEnd?.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-5xl">Аккаунт</h1>

      {sp.checkout === "success" && (
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--sea)] bg-[var(--sea)]/10 p-4 text-sm" role="status">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--pine)]" />
          <p>
            Спасибо за оплату! {pro ? "Pro уже активен." : "Подтверждение от Stripe придёт через несколько секунд — обновите страницу."}
          </p>
        </div>
      )}

      <section className="rounded-3xl border bg-card p-6">
        <p className="text-sm text-muted-foreground">Профиль</p>
        <p className="text-lg font-semibold">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-2 text-sm text-muted-foreground">Часовой пояс: {user.timezone}</p>
      </section>

      <section className="rounded-3xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Текущий тариф</p>
            <p className="font-heading text-4xl">{pro ? "Pro" : "Free"}</p>
          </div>
          {pro ? (
            <Badge className="bg-[var(--brick)] text-white">Pro</Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
        </div>

        {user.subscriptionStatus && (
          <p className="mt-2 text-sm text-muted-foreground">
            Подписка помесячная: {STATUS[user.subscriptionStatus] ?? user.subscriptionStatus}
            {periodEnd ? ` · текущий период до ${periodEnd}` : ""}
          </p>
        )}

        <Separator className="my-5" />
        <ul className="space-y-2 text-sm">
          {(pro ? PLAN_FEATURES.pro : PLAN_FEATURES.free).map((f) => (
            <li key={f} className="flex gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-[var(--pine)] dark:text-[var(--sea)]" /> {f}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          {!pro && (
            <Button asChild size="lg" className="bg-[var(--brick)] text-white hover:bg-[var(--brick)]/90">
              <Link href="/pricing">
                <Sparkles /> Перейти на Pro
              </Link>
            </Button>
          )}
          {user.stripeCustomerId && <ManageSubscriptionButton />}
        </div>
      </section>

      <UsageMeter initial={usage} />
    </div>
  );
}
