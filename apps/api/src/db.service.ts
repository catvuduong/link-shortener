import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS items (id SERIAL PRIMARY KEY, title TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT now());
  CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    target_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS clicks (
    id BIGSERIAL PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    referrer TEXT,
    country TEXT,
    device TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS clicks_link_id_clicked_at_idx ON clicks (link_id, clicked_at);
`;

@Injectable()
export class DbService implements OnModuleDestroy {
  private readonly pool = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, max: 3 })
    : null;
  private ready: Promise<void> | null = null;

  get enabled(): boolean {
    return this.pool !== null;
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    if (!this.pool) throw new Error('DATABASE_URL is not set');
    this.ready ??= this.pool.query(SCHEMA).then(() => undefined);
    await this.ready;
    const res = await this.pool.query(sql, params);
    return res.rows as T[];
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
