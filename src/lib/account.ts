import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FREE_DAILY_SECONDS, isPro } from "@/lib/plans";
import { currentPeriodKey, nextResetAt } from "@/lib/usage";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type UsageState = {
  pro: boolean;
  limitSeconds: number | null; // null = unlimited
  usedSeconds: number;
  remainingSeconds: number | null;
  resetAt: string; // ISO
  timezone: string;
};

export async function getUsageState(user: CurrentUser): Promise<UsageState> {
  const pro = isPro(user);
  const periodKey = currentPeriodKey(user.timezone);
  const row = await db.dailyUsage.findUnique({
    where: { userId_periodKey: { userId: user.id, periodKey } },
  });
  const used = row?.secondsUsed ?? 0;
  return {
    pro,
    limitSeconds: pro ? null : FREE_DAILY_SECONDS,
    usedSeconds: used,
    remainingSeconds: pro ? null : Math.max(0, FREE_DAILY_SECONDS - used),
    resetAt: nextResetAt(user.timezone).toISOString(),
    timezone: user.timezone,
  };
}

const HEARTBEAT_SECONDS = 15;
const MIN_GAP_MS = 12_000;

/** Records one heartbeat of active practice. Ignores beats that arrive too quickly (double tabs, replays). */
export async function recordHeartbeat(user: CurrentUser): Promise<UsageState> {
  const periodKey = currentPeriodKey(user.timezone);
  const now = new Date();
  const row = await db.dailyUsage.upsert({
    where: { userId_periodKey: { userId: user.id, periodKey } },
    create: { userId: user.id, periodKey, secondsUsed: 0 },
    update: {},
  });
  const tooSoon = row.lastHeartbeatAt && now.getTime() - row.lastHeartbeatAt.getTime() < MIN_GAP_MS;
  if (!tooSoon) {
    await db.dailyUsage.update({
      where: { id: row.id },
      data: { secondsUsed: { increment: HEARTBEAT_SECONDS }, lastHeartbeatAt: now },
    });
  }
  return getUsageState(user);
}

/** True if the user may use practice features right now. */
export async function hasPracticeTime(user: CurrentUser): Promise<{ ok: boolean; usage: UsageState }> {
  const usage = await getUsageState(user);
  return { ok: usage.pro || (usage.remainingSeconds ?? 0) > 0, usage };
}
