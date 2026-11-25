import { describe, expect, it } from "vitest";
import { currentPeriodKey, formatDuration, isValidTimeZone, nextResetAt } from "./usage";

describe("currentPeriodKey", () => {
  it("Moscow: before noon belongs to the previous day's period", () => {
    // 08:00 UTC = 11:00 MSK
    expect(currentPeriodKey("Europe/Moscow", new Date("2026-11-21T08:00:00Z"))).toBe("2026-11-20");
  });

  it("Moscow: at/after noon opens a new period", () => {
    // 09:00 UTC = 12:00 MSK
    expect(currentPeriodKey("Europe/Moscow", new Date("2026-11-21T09:00:00Z"))).toBe("2026-11-21");
  });

  it("New York uses its own local noon", () => {
    // 16:59 UTC = 11:59 EST
    expect(currentPeriodKey("America/New_York", new Date("2026-11-21T16:59:00Z"))).toBe("2026-11-20");
    // 17:00 UTC = 12:00 EST
    expect(currentPeriodKey("America/New_York", new Date("2026-11-21T17:00:00Z"))).toBe("2026-11-21");
  });

  it("Tokyo crosses the UTC date line correctly", () => {
    // 2026-11-21 02:30 UTC = 11:30 JST on 21st
    expect(currentPeriodKey("Asia/Tokyo", new Date("2026-11-21T02:30:00Z"))).toBe("2026-11-20");
    // 2026-11-21 20:00 UTC = 05:00 JST on 22nd → still the 21st's period
    expect(currentPeriodKey("Asia/Tokyo", new Date("2026-11-21T20:00:00Z"))).toBe("2026-11-21");
  });

  it("handles month and year boundaries", () => {
    expect(currentPeriodKey("UTC", new Date("2027-01-01T06:00:00Z"))).toBe("2026-12-31");
  });
});

describe("nextResetAt", () => {
  it("Moscow before noon → today 12:00 MSK", () => {
    expect(nextResetAt("Europe/Moscow", new Date("2026-11-21T08:00:00Z")).toISOString()).toBe(
      "2026-11-21T09:00:00.000Z",
    );
  });

  it("Moscow after noon → tomorrow 12:00 MSK", () => {
    expect(nextResetAt("Europe/Moscow", new Date("2026-11-21T10:00:00Z")).toISOString()).toBe(
      "2026-11-22T09:00:00.000Z",
    );
  });

  it("New York across a DST change (EDT → EST on 2026-11-01)", () => {
    // 2026-10-31 18:00 UTC = 14:00 EDT → next reset 2026-11-01 12:00 EST = 17:00 UTC
    expect(nextResetAt("America/New_York", new Date("2026-10-31T18:00:00Z")).toISOString()).toBe(
      "2026-11-01T17:00:00.000Z",
    );
  });

  it("Tokyo", () => {
    expect(nextResetAt("Asia/Tokyo", new Date("2026-11-21T20:00:00Z")).toISOString()).toBe(
      "2026-11-22T03:00:00.000Z",
    );
  });
});

describe("helpers", () => {
  it("formatDuration", () => {
    expect(formatDuration(600)).toBe("10:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(-5)).toBe("0:00");
  });
  it("isValidTimeZone", () => {
    expect(isValidTimeZone("Europe/Moscow")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
