import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/account";
import { apiError } from "@/lib/api";
import { isPro } from "@/lib/plans";
import { appUrl, proPriceId, stripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Войдите, чтобы оформить Pro.");
  if (isPro(user)) return NextResponse.json({ url: appUrl("/account") });

  try {
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe().customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: proPriceId(), quantity: 1 }],
      subscription_data: { metadata: { userId: user.id } },
      metadata: { userId: user.id },
      allow_promotion_codes: true,
      success_url: appUrl("/account?checkout=success"),
      cancel_url: appUrl("/pricing?checkout=cancelled"),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe checkout failed", e);
    return NextResponse.json({ error: "Не удалось открыть оплату. Попробуйте позже." }, { status: 500 });
  }
}
