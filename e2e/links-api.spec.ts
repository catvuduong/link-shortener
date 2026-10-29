import { test, expect } from '@playwright/test';

const API = 'http://localhost:3001';

// Unique per run so repeated runs against the same database never collide.
const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

test.describe('links API', () => {
  test('creates a link with a generated slug', async ({ request }) => {
    const res = await request.post(`${API}/links`, {
      data: { url: `https://example.com/generated-${suffix}` },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.slug).toMatch(/^[a-z0-9]{6}$/);
    expect(body.targetUrl).toBe(`https://example.com/generated-${suffix}`);
    expect(body.clicks).toBe(0);
  });

  test('creates a link with a custom slug and rejects a duplicate', async ({ request }) => {
    const slug = `dup-${suffix}`;
    const first = await request.post(`${API}/links`, {
      data: { url: 'https://example.com/first', slug },
    });
    expect(first.status()).toBe(201);

    const second = await request.post(`${API}/links`, {
      data: { url: 'https://example.com/second', slug },
    });
    expect(second.status()).toBe(409);
  });

  test('rejects invalid and private target URLs', async ({ request }) => {
    for (const url of ['javascript:alert(1)', 'ftp://example.com/x', 'not a url', 'http://localhost:3001/']) {
      const res = await request.post(`${API}/links`, { data: { url } });
      expect(res.status(), url).toBe(400);
    }
  });

  test('redirects to the target and records the click', async ({ request }) => {
    const slug = `hit-${suffix}`;
    await request.post(`${API}/links`, { data: { url: 'https://example.com/landing', slug } });

    const redirect = await request.get(`${API}/r/${slug}`, {
      maxRedirects: 0,
      headers: {
        referer: 'https://www.news.example/story',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148',
        'x-vercel-ip-country': 'DE',
      },
    });
    expect(redirect.status()).toBe(302);
    expect(redirect.headers()['location']).toBe('https://example.com/landing');

    const stats = await (await request.get(`${API}/links/${slug}/stats`)).json();
    expect(stats.totalClicks).toBe(1);
    expect(stats.clicksPerDay).toHaveLength(14);
    expect(stats.clicksPerDay.at(-1).clicks).toBe(1);
    expect(stats.topReferrers).toEqual([{ referrer: 'news.example', clicks: 1 }]);
    expect(stats.devices).toEqual([{ device: 'mobile', clicks: 1 }]);
  });

  test('returns 404 for an unknown slug', async ({ request }) => {
    const redirect = await request.get(`${API}/r/missing-${suffix}`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(404);

    const stats = await request.get(`${API}/links/missing-${suffix}/stats`);
    expect(stats.status()).toBe(404);
  });

  test('lists links with click counts and deletes them', async ({ request }) => {
    const slug = `list-${suffix}`;
    await request.post(`${API}/links`, { data: { url: 'https://example.com/list', slug } });
    await request.get(`${API}/r/${slug}`, { maxRedirects: 0 });

    const links = await (await request.get(`${API}/links`)).json();
    const listed = links.find((link: { slug: string }) => link.slug === slug);
    expect(listed.clicks).toBe(1);

    const deleted = await request.delete(`${API}/links/${slug}`);
    expect(deleted.status()).toBe(204);
    expect((await request.get(`${API}/r/${slug}`, { maxRedirects: 0 })).status()).toBe(404);
  });

  test('seeds demo links with click history', async ({ request }) => {
    const links = await (await request.get(`${API}/links`)).json();
    const slugs = links.map((link: { slug: string }) => link.slug);
    expect(slugs).toEqual(expect.arrayContaining(['next-docs', 'nest-intro', 'pg-indexes', 'pw-intro']));

    const stats = await (await request.get(`${API}/links/next-docs/stats`)).json();
    expect(stats.totalClicks).toBeGreaterThan(0);
    expect(stats.clicksPerDay.filter((day: { clicks: number }) => day.clicks > 0).length).toBeGreaterThan(0);
  });
});
