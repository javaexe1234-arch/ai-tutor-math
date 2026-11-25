import { NextResponse } from "next/server";
import { getCurrentUser, getUsageState, recordHeartbeat } from "@/lib/account";
import { apiError } from "@/lib/api";
import { isPro } from "@/lib/plans";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Войдите в аккаунт.");
  // Pro time is unlimited — nothing to count.
  const usage = isPro(user) ? await getUsageState(user) : await recordHeartbeat(user);
  return NextResponse.json(usage);
}
