const DAY_MS = 24 * 60 * 60 * 1000;

export function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// The last `count` UTC calendar days ending today, oldest first, as YYYY-MM-DD.
export function lastUtcDays(count: number, now: Date): string[] {
  const today = utcDayStart(now).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(today - (count - 1 - i) * DAY_MS).toISOString().slice(0, 10),
  );
}
