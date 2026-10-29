import { countryCode, deviceFromUserAgent, referrerHost } from './request-info.js';

describe('deviceFromUserAgent', () => {
  it.each([
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15', 'desktop'],
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148', 'mobile'],
    ['Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/120.0 Mobile Safari/537.36', 'mobile'],
    ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)', 'tablet'],
    ['Mozilla/5.0 (Linux; Android 14; SM-X700) Chrome/120.0 Safari/537.36', 'tablet'],
    ['Googlebot/2.1 (+http://www.google.com/bot.html)', 'bot'],
  ])('classifies %s as %s', (userAgent, device) => {
    expect(deviceFromUserAgent(userAgent)).toBe(device);
  });

  it('is unknown without a user-agent', () => {
    expect(deviceFromUserAgent(undefined)).toBe('unknown');
  });
});

describe('referrerHost', () => {
  it('keeps only the host and strips www.', () => {
    expect(referrerHost('https://www.twitter.com/some/status/1')).toBe('twitter.com');
  });

  it('is null for missing or malformed referrers', () => {
    expect(referrerHost(undefined)).toBeNull();
    expect(referrerHost('not a url')).toBeNull();
  });
});

describe('countryCode', () => {
  it('uppercases a two-letter Vercel country header', () => {
    expect(countryCode(' de ')).toBe('DE');
  });

  it('ignores anything that is not a two-letter code', () => {
    expect(countryCode('XXX')).toBeNull();
    expect(countryCode(undefined)).toBeNull();
  });
});
