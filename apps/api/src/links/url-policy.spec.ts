import { BadRequestException } from '@nestjs/common';
import { isPrivateHostname, normalizeTargetUrl } from './url-policy.js';

describe('normalizeTargetUrl', () => {
  it('accepts public http and https URLs', () => {
    expect(normalizeTargetUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(normalizeTargetUrl('  http://nextjs.org/docs ')).toBe('http://nextjs.org/docs');
  });

  it.each(['ftp://example.com/file', 'javascript:alert(1)', 'mailto:a@example.com'])(
    'rejects non-http scheme %s',
    (url) => {
      expect(() => normalizeTargetUrl(url)).toThrow(BadRequestException);
    },
  );

  it.each(['not a url', '', 'example.com'])('rejects input that is not an absolute URL: %j', (url) => {
    expect(() => normalizeTargetUrl(url)).toThrow(BadRequestException);
  });

  it.each([
    'http://localhost:3001/health',
    'http://127.0.0.1/',
    'http://10.0.0.5/admin',
    'http://192.168.1.10/',
    'http://172.16.0.1/',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]/',
    'http://[fd00::1]/',
    'http://intranet/',
    'http://printer.local/',
  ])('rejects private or local target %s', (url) => {
    expect(() => normalizeTargetUrl(url)).toThrow(BadRequestException);
  });

  it('rejects URLs longer than 2048 characters', () => {
    const url = `https://example.com/${'a'.repeat(2048)}`;
    expect(() => normalizeTargetUrl(url)).toThrow('url is too long');
  });
});

describe('isPrivateHostname', () => {
  it.each([
    ['172.32.0.1', false],
    ['100.63.0.1', false],
    ['8.8.8.8', false],
    ['100.64.0.1', true],
    ['0.0.0.0', true],
    ['[2606:4700::1111]', false],
    ['[fe80::1]', true],
    ['[::ffff:127.0.0.1]', true],
  ])('%s is private: %s', (host, expected) => {
    expect(isPrivateHostname(host)).toBe(expected);
  });
});
