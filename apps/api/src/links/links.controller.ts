import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { normalizeTargetUrl } from './url-policy.js';
import { LinksService } from './links.service.js';
import { parseCustomSlug } from './slug.js';

interface CreateLinkBody {
  url?: unknown;
  slug?: unknown;
}

@Controller('links')
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post()
  create(@Body() body: CreateLinkBody) {
    if (typeof body?.url !== 'string') throw new BadRequestException('url is required');
    const targetUrl = normalizeTargetUrl(body.url);
    const slug = body.slug === undefined || body.slug === null || body.slug === ''
      ? undefined
      : parseCustomSlug(body.slug);
    return this.links.create(targetUrl, slug);
  }

  @Get()
  list() {
    return this.links.list();
  }

  @Get(':slug/stats')
  stats(@Param('slug') slug: string) {
    return this.links.stats(slug);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slug') slug: string) {
    return this.links.remove(slug);
  }
}
