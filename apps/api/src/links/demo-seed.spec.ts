import { buildDemoLinks } from './demo-seed.js';
import { lastUtcDays } from './dates.js';

describe('buildDemoLinks', () => {
  const now = new Date('2026-10-29T15:00:00Z');

  it('is deterministic for the same moment', () => {
    expect(buildDemoLinks(now)).toEqual(buildDemoLinks(now));
  });

  it('populates the last 14 days of the busiest demo link', () => {
    const days = lastUtcDays(14, now);
    const busiest = buildDemoLinks(now).find((link) => link.slug === 'next-docs');
    const clickedDays = new Set(busiest?.clicks.map((c) => c.clickedAt.toISOString().slice(0, 10)));
    expect(days.filter((day) => clickedDays.has(day))).toHaveLength(14);
  });

  it('never records a click in the future or before the link was created', () => {
    for (const link of buildDemoLinks(now)) {
      for (const click of link.clicks) {
        expect(click.clickedAt.getTime()).toBeLessThanOrEqual(now.getTime());
        expect(click.clickedAt.getTime()).toBeGreaterThanOrEqual(link.createdAt.getTime());
      }
    }
  });
});
