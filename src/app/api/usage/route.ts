import { NextResponse } from "next/server";
import { getCurrentUser, getUsageState } from "@/lib/account";
import { apiError } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("UNAUTHORIZED", "Войдите в аккаунт.");
  return NextResponse.json(await getUsageState(user));
}
