import type { DeviceType } from './request-info.js';
import { utcDayStart } from './dates.js';

const DAY_MS = 24 * 60 * 60 * 1000;

interface DemoLinkSpec {
  slug: string;
  targetUrl: string;
  ageDays: number;
  clicksPerDay: number;
}

export interface DemoClick {
  clickedAt: Date;
  referrer: string | null;
  country: string;
  device: DeviceType;
}

export interface DemoLink {
  slug: string;
  targetUrl: string;
  createdAt: Date;
  clicks: DemoClick[];
}

const DEMO_LINKS: DemoLinkSpec[] = [
  { slug: 'next-docs', targetUrl: 'https://nextjs.org/docs', ageDays: 30, clicksPerDay: 9 },
  { slug: 'nest-intro', targetUrl: 'https://docs.nestjs.com/', ageDays: 26, clicksPerDay: 5 },
  {
    slug: 'pg-indexes',
    targetUrl: 'https://www.postgresql.org/docs/current/indexes.html',
    ageDays: 21,
    clicksPerDay: 3,
  },
  { slug: 'pw-intro', targetUrl: 'https://playwright.dev/docs/intro', ageDays: 14, clicksPerDay: 6 },
];

const REFERRERS: [string | null, number][] = [
  [null, 40],
  ['twitter.com', 18],
  ['news.ycombinator.com', 14],
  ['google.com', 16],
  ['github.com', 12],
];
const COUNTRIES: [string, number][] = [
  ['US', 30],
  ['GB', 14],
  ['DE', 12],
  ['VN', 14],
  ['IN', 16],
  ['BR', 14],
];
const DEVICES: [DeviceType, number][] = [
  ['desktop', 55],
  ['mobile', 38],
  ['tablet', 7],
];

// Builds the same demo history for the same UTC day, so re-seeding never produces different data.
export function buildDemoLinks(now: Date): DemoLink[] {
  const today = utcDayStart(now).getTime();
  return DEMO_LINKS.map((spec) => {
    const random = seededRandom(spec.slug);
    const createdAt = new Date(today - spec.ageDays * DAY_MS);
    const clicks: DemoClick[] = [];

    for (let daysAgo = spec.ageDays - 1; daysAgo >= 0; daysAgo--) {
      const dayStart = today - daysAgo * DAY_MS;
      const count = Math.round(spec.clicksPerDay * (0.5 + random()) * weekendFactor(dayStart));

      for (let i = 0; i < count; i++) {
        const clickedAt = new Date(dayStart + Math.floor(random() * DAY_MS));
        // The full day is drawn first so the sequence stays fixed; clicks after `now` are dropped.
        if (clickedAt > now) continue;
        clicks.push({
          clickedAt,
          referrer: pick(REFERRERS, random),
          country: pick(COUNTRIES, random),
          device: pick(DEVICES, random),
        });
      }
    }

    return { slug: spec.slug, targetUrl: spec.targetUrl, createdAt, clicks };
  });
}

function weekendFactor(dayStart: number): number {
  const day = new Date(dayStart).getUTCDay();
  return day === 0 || day === 6 ? 0.6 : 1;
}

function pick<T>(weighted: [T, number][], random: () => number): T {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of weighted) {
    roll -= weight;
    if (roll < 0) return value;
  }
  return weighted[weighted.length - 1][0];
}

// FNV-1a hash of the slug seeds a mulberry32 generator, so each link gets its own stable sequence.
function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  }
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
