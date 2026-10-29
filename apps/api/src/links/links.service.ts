import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db.service.js';
import { lastUtcDays } from './dates.js';
import type { DeviceType } from './request-info.js';
import { randomSlug } from './slug.js';

const GENERATED_SLUG_ATTEMPTS = 5;
const STATS_DAYS = 14;
const TOP_REFERRERS = 5;

export interface LinkSummary {
  slug: string;
  targetUrl: string;
  createdAt: Date;
  clicks: number;
}

export interface LinkStats {
  slug: string;
  targetUrl: string;
  createdAt: Date;
  totalClicks: number;
  clicksPerDay: { date: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
  devices: { device: DeviceType; clicks: number }[];
}

export interface ClickInfo {
  referrer: string | null;
  country: string | null;
  device: DeviceType;
}

@Injectable()
export class LinksService {
  constructor(private readonly db: DbService) {}

  // Creates the link, or with no slug given, retries random slugs until one is free.
  async create(targetUrl: string, slug?: string): Promise<LinkSummary> {
    if (slug) {
      const link = await this.insert(slug, targetUrl);
      if (!link) throw new ConflictException(`slug "${slug}" is already taken`);
      return link;
    }
    for (let attempt = 0; attempt < GENERATED_SLUG_ATTEMPTS; attempt++) {
      const link = await this.insert(randomSlug(), targetUrl);
      if (link) return link;
    }
    throw new ConflictException('could not find a free slug, try again');
  }

  list(): Promise<LinkSummary[]> {
    return this.db.query<LinkSummary>(
      `SELECT l.slug, l.target_url AS "targetUrl", l.created_at AS "createdAt",
              COUNT(c.id)::int AS clicks
         FROM links l
         LEFT JOIN clicks c ON c.link_id = l.id
        GROUP BY l.id
        ORDER BY l.created_at DESC, l.id DESC
        LIMIT 100`,
    );
  }

  async remove(slug: string): Promise<void> {
    const rows = await this.db.query<{ id: number }>(
      'DELETE FROM links WHERE slug = $1 RETURNING id',
      [slug],
    );
    if (rows.length === 0) throw new NotFoundException(`no link for "${slug}"`);
  }

  async stats(slug: string, now = new Date()): Promise<LinkStats> {
    const link = await this.findBySlug(slug);
    const days = lastUtcDays(STATS_DAYS, now);
    const since = new Date(`${days[0]}T00:00:00Z`);

    const [daily, referrers, devices] = await Promise.all([
      this.db.query<{ day: string; clicks: number }>(
        `SELECT to_char(clicked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::int AS clicks
           FROM clicks
          WHERE link_id = $1 AND clicked_at >= $2
          GROUP BY day`,
        [link.id, since.toISOString()],
      ),
      this.db.query<{ referrer: string; clicks: number }>(
        `SELECT COALESCE(referrer, 'direct') AS referrer, COUNT(*)::int AS clicks
           FROM clicks
          WHERE link_id = $1
          GROUP BY 1
          ORDER BY clicks DESC, referrer
          LIMIT $2`,
        [link.id, TOP_REFERRERS],
      ),
      this.db.query<{ device: DeviceType; clicks: number }>(
        `SELECT device, COUNT(*)::int AS clicks
           FROM clicks
          WHERE link_id = $1
          GROUP BY device
          ORDER BY clicks DESC, device`,
        [link.id],
      ),
    ]);

    const countsByDay = new Map(daily.map((row) => [row.day, row.clicks]));
    return {
      slug: link.slug,
      targetUrl: link.targetUrl,
      createdAt: link.createdAt,
      totalClicks: devices.reduce((sum, row) => sum + row.clicks, 0),
      clicksPerDay: days.map((date) => ({ date, clicks: countsByDay.get(date) ?? 0 })),
      topReferrers: referrers,
      devices,
    };
  }

  // Records the click and returns the target in one statement. Null when the slug is unknown.
  async recordClick(slug: string, click: ClickInfo): Promise<string | null> {
    const rows = await this.db.query<{ target_url: string }>(
      `WITH link AS (
         SELECT id, target_url FROM links WHERE slug = $1
       ),
       clicked AS (
         INSERT INTO clicks (link_id, referrer, country, device)
         SELECT id, $2::text, $3::text, $4::text FROM link
         RETURNING id
       )
       SELECT target_url FROM link`,
      [slug, click.referrer, click.country, click.device],
    );
    return rows[0]?.target_url ?? null;
  }

  private async insert(slug: string, targetUrl: string): Promise<LinkSummary | null> {
    const rows = await this.db.query<Omit<LinkSummary, 'clicks'>>(
      `INSERT INTO links (slug, target_url) VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING
       RETURNING slug, target_url AS "targetUrl", created_at AS "createdAt"`,
      [slug, targetUrl],
    );
    return rows[0] ? { ...rows[0], clicks: 0 } : null;
  }

  private async findBySlug(slug: string) {
    const rows = await this.db.query<{ id: number } & Omit<LinkSummary, 'clicks'>>(
      `SELECT id, slug, target_url AS "targetUrl", created_at AS "createdAt"
         FROM links WHERE slug = $1`,
      [slug],
    );
    if (rows.length === 0) throw new NotFoundException(`no link for "${slug}"`);
    return rows[0];
  }
}
