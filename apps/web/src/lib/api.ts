export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface LinkRow {
  slug: string;
  targetUrl: string;
  createdAt: string;
  clicks: number;
}

export interface LinkStats {
  slug: string;
  targetUrl: string;
  createdAt: string;
  totalClicks: number;
  clicksPerDay: { date: string; clicks: number }[];
  topReferrers: { referrer: string; clicks: number }[];
  devices: { device: string; clicks: number }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function shortUrl(slug: string): string {
  return `${API_URL}/r/${slug}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new ApiError('Could not reach the API. Is it running?', 0);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.message === 'string') message = body.message;
    } catch {
      // Non-JSON error bodies keep the generic message.
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listLinks: () => request<LinkRow[]>('/links'),

  createLink: (url: string, slug?: string) =>
    request<LinkRow>('/links', {
      method: 'POST',
      body: JSON.stringify(slug ? { url, slug } : { url }),
    }),

  deleteLink: (slug: string) => request<void>(`/links/${encodeURIComponent(slug)}`, { method: 'DELETE' }),

  getStats: (slug: string) => request<LinkStats>(`/links/${encodeURIComponent(slug)}/stats`),
};
