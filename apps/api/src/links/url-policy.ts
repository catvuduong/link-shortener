import { BadRequestException } from '@nestjs/common';

const MAX_URL_LENGTH = 2048;

// Returns the normalized URL to store, or throws 400 when the target is not a public http(s) URL.
export function normalizeTargetUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length > MAX_URL_LENGTH) throw new BadRequestException('url is too long');

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new BadRequestException('url must be an absolute URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new BadRequestException('url must use http or https');
  }
  if (isPrivateHostname(url.hostname)) {
    throw new BadRequestException('url must point to a public host');
  }
  return url.href;
}

// `hostname` comes from WHATWG URL parsing, so IPv4 is already dotted-decimal and IPv6 is bracketed.
export function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host.startsWith('[')) return isPrivateIpv6(host.slice(1, -1));
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return isPrivateIpv4(host);

  const isLocalName =
    host === 'localhost' || /\.(localhost|local|localdomain|internal)$/.test(host);
  const isSingleLabel = !host.includes('.');
  return isLocalName || isSingleLabel;
}

function isPrivateIpv4(address: string): boolean {
  const [a, b] = address.split('.').map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  // IPv4-mapped (::ffff:a.b.c.d) addresses are rejected outright rather than unwrapped.
  return (
    address === '::' ||
    address === '::1' ||
    address.startsWith('::ffff:') ||
    /^f[cd]/.test(address) ||
    /^fe[89ab]/.test(address)
  );
}
