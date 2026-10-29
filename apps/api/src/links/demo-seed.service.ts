import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DbService } from '../db.service.js';
import { buildDemoLinks, DemoLink } from './demo-seed.js';

// Adds the demo links and their click history on boot so the first page load has data.
// Each link is inserted together with its clicks in one statement, and only when its slug is new.
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(private readonly db: DbService) {}

  async onApplicationBootstrap() {
    if (!this.db.enabled) return;
    try {
      for (const link of buildDemoLinks(new Date())) {
        await this.seed(link);
      }
    } catch (err) {
      this.logger.warn(`demo seed skipped: ${(err as Error).message}`);
    }
  }

  private seed(link: DemoLink): Promise<unknown[]> {
    const { clicks } = link;
    return this.db.query(
      `WITH inserted AS (
         INSERT INTO links (slug, target_url, created_at) VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO NOTHING
         RETURNING id
       )
       INSERT INTO clicks (link_id, clicked_at, referrer, country, device)
       SELECT inserted.id, c.clicked_at, c.referrer, c.country, c.device
         FROM inserted
         CROSS JOIN unnest(
           $4::timestamptz[], $5::text[], $6::text[], $7::text[]
         ) AS c(clicked_at, referrer, country, device)`,
      [
        link.slug,
        link.targetUrl,
        link.createdAt.toISOString(),
        clicks.map((click) => click.clickedAt.toISOString()),
        clicks.map((click) => click.referrer),
        clicks.map((click) => click.country),
        clicks.map((click) => click.device),
      ],
    );
  }
}
