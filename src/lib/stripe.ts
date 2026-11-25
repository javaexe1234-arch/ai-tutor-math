import "server-only";
import Stripe from "stripe";
import { db } from "@/lib/db";

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function proPriceId(): string {
  const id = process.env.STRIPE_PRICE_PRO_MONTHLY;
  if (!id) throw new Error("STRIPE_PRICE_PRO_MONTHLY is not configured");
  return id;
}

export function appUrl(path = ""): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${path}`;
}

/** Mirror a Stripe subscription onto our user row. Stripe is the source of truth. */
export async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const item = sub.items.data[0];
  const live = ["active", "trialing"].includes(sub.status);
  const interval = item?.price.recurring?.interval === "year" ? "yearly" : "monthly";

  const where = sub.metadata?.userId ? { id: sub.metadata.userId } : { stripeCustomerId: customerId };
  await db.user.update({
    where,
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      billingInterval: interval,
      currentPeriodEnd: item ? new Date(item.current_period_end * 1000) : null,
      plan: live ? "PRO" : "FREE",
    },
  });
}
