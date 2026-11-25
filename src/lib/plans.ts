import type { Plan } from "@prisma/client";

export const FREE_DAILY_SECONDS = 10 * 60;
export const FREE_LESSON_LIMIT = 5;
/** Quiz score (%) needed to mark a lesson as completed. */
export const PASS_SCORE = 70;

export type PlanUser = {
  plan: Plan;
  subscriptionStatus: string | null;
  currentPeriodEnd: Date | null;
};

/** Pro is granted only while Stripe says the subscription is live. */
export function isPro(user: PlanUser | null | undefined): boolean {
  if (!user || user.plan !== "PRO") return false;
  if (!["active", "trialing"].includes(user.subscriptionStatus ?? "")) return false;
  return !user.currentPeriodEnd || user.currentPeriodEnd.getTime() > Date.now();
}

/** Display price only — the amount charged is the Stripe price in STRIPE_PRICE_PRO_MONTHLY. */
export const PRICING = { label: "$5", per: "в месяц" } as const;

export const PLAN_FEATURES = {
  free: [
    "10 минут практики в день (сброс в 12:00)",
    "Базовые темы начального этапа",
    "5 бесплатных уроков",
    "Квизы и задачи",
    "Умножение и деление",
  ],
  pro: [
    "Неограниченное время занятий",
    "Все этапы: Начальный, Продвинутый, Эксперт",
    "AI-проверка ваших решений",
    "Пошаговый разбор ошибок",
    "Похожие задачи для закрепления",
  ],
};
