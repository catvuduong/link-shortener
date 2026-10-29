import { ConflictException, NotFoundException } from '@nestjs/common';
import { LinksService } from './links.service.js';
import { DbService } from '../db.service.js';

describe('LinksService', () => {
  const db = { enabled: true, query: vi.fn() };
  let service: LinksService;

  beforeEach(() => {
    db.query.mockReset();
    service = new LinksService(db as unknown as DbService);
  });

  it('rejects a custom slug that is already taken', async () => {
    db.query.mockResolvedValueOnce([]);
    await expect(service.create('https://example.com', 'taken')).rejects.toThrow(ConflictException);
  });

  it('retries generated slugs until one is free', async () => {
    db.query
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ slug: 'abc123', targetUrl: 'https://example.com', createdAt: new Date() }]);

    const link = await service.create('https://example.com');

    expect(link.slug).toBe('abc123');
    expect(link.clicks).toBe(0);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('gives up with 409 after repeated generated-slug collisions', async () => {
    db.query.mockResolvedValue([]);
    await expect(service.create('https://example.com')).rejects.toThrow(ConflictException);
  });

  it('returns null from recordClick for an unknown slug', async () => {
    db.query.mockResolvedValueOnce([]);
    expect(await service.recordClick('missing', { referrer: null, country: null, device: 'desktop' })).toBeNull();
  });

  it('throws 404 for stats on an unknown slug', async () => {
    db.query.mockResolvedValueOnce([]);
    await expect(service.stats('missing')).rejects.toThrow(NotFoundException);
  });

  it('fills missing days with zero clicks in stats', async () => {
    db.query
      .mockResolvedValueOnce([{ id: 1, slug: 'abc', targetUrl: 'https://example.com', createdAt: new Date() }])
      .mockResolvedValueOnce([{ day: '2026-10-29', clicks: 4 }])
      .mockResolvedValueOnce([{ referrer: 'direct', clicks: 4 }])
      .mockResolvedValueOnce([{ device: 'desktop', clicks: 4 }]);

    const stats = await service.stats('abc', new Date('2026-10-29T12:00:00Z'));

    expect(stats.clicksPerDay).toHaveLength(14);
    expect(stats.clicksPerDay.at(-1)).toEqual({ date: '2026-10-29', clicks: 4 });
    expect(stats.clicksPerDay[0]).toEqual({ date: '2026-10-16', clicks: 0 });
    expect(stats.totalClicks).toBe(4);
  });
});
