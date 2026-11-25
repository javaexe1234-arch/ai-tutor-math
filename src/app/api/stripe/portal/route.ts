import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/account";
import { apiError } from "@/lib/api";
import { appUrl, stripe } from "@/lib/stripe";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Войдите в аккаунт.");
  if (!user.stripeCustomerId) return apiError("BAD_REQUEST", "У вас ещё нет подписки.");
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: appUrl("/account"),
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("stripe portal failed", e);
    return NextResponse.json({ error: "Не удалось открыть управление подпиской." }, { status: 500 });
  }
}
