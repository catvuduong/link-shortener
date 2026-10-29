import { randomInt } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';

const GENERATED_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const CUSTOM_SLUG = /^[a-z0-9][a-z0-9_-]{2,31}$/;

export function randomSlug(length = 6): string {
  let slug = '';
  for (let i = 0; i < length; i++) {
    slug += GENERATED_ALPHABET[randomInt(GENERATED_ALPHABET.length)];
  }
  return slug;
}

export function parseCustomSlug(input: unknown): string {
  const slug = typeof input === 'string' ? input.trim().toLowerCase() : '';
  if (!CUSTOM_SLUG.test(slug)) {
    throw new BadRequestException(
      'slug must be 3-32 characters: letters, digits, "-" or "_", starting with a letter or digit',
    );
  }
  return slug;
}
