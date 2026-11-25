/**
 * Pure date helpers for the Free plan daily limit.
 * A "day" for the limit starts at 12:00 (noon) in the user's own timezone.
 */

export const RESET_HOUR = 12;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function localParts(tz: string, at: Date): LocalParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(fmt.formatToParts(at).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour) % 24,
    minute: Number(p.minute),
    second: Number(p.second),
  };
}

/** Offset of `tz` from UTC at instant `at`, in milliseconds (local - UTC). */
function tzOffsetMs(tz: string, at: Date): number {
  const p = localParts(tz, at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar date (YYYY-MM-DD) of the most recent local noon — identifies the current limit period. */
export function currentPeriodKey(tz: string, now: Date = new Date()): string {
  const p = localParts(tz, now);
  const d = new Date(Date.UTC(p.year, p.month - 1, p.day));
  if (p.hour < RESET_HOUR) d.setUTCDate(d.getUTCDate() - 1);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** The UTC instant of the next local 12:00 in `tz`. */
export function nextResetAt(tz: string, now: Date = new Date()): Date {
  const [y, m, d] = currentPeriodKey(tz, now).split("-").map(Number);
  // Noon on the day after the period start, expressed as if it were UTC…
  const naive = Date.UTC(y, m - 1, d + 1, RESET_HOUR, 0, 0);
  // …then shift by the zone offset (re-evaluated once to handle DST changes).
  let guess = naive - tzOffsetMs(tz, new Date(naive));
  guess = naive - tzOffsetMs(tz, new Date(guess));
  return new Date(guess);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
