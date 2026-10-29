export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'bot' | 'unknown';

const BOT = /bot|crawl|spider|slurp|headless|preview/i;
const TABLET = /ipad|tablet|kindle|silk|playbook|android(?!.*mobile)/i;
const MOBILE = /mobi|iphone|ipod|windows phone/i;

export function deviceFromUserAgent(userAgent: string | undefined): DeviceType {
  if (!userAgent) return 'unknown';
  if (BOT.test(userAgent)) return 'bot';
  if (TABLET.test(userAgent)) return 'tablet';
  if (MOBILE.test(userAgent)) return 'mobile';
  return 'desktop';
}

// Stores the referring host only ("www." stripped), so "top referrers" groups by site.
export function referrerHost(referer: string | undefined): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

export function countryCode(header: string | undefined): string | null {
  const code = header?.trim().toUpperCase();
  return code && /^[A-Z]{2}$/.test(code) ? code : null;
}
