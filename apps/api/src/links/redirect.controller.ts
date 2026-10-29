import { Controller, Get, Headers, NotFoundException, Param, Redirect } from '@nestjs/common';
import { LinksService } from './links.service.js';
import { countryCode, deviceFromUserAgent, referrerHost } from './request-info.js';

@Controller('r')
export class RedirectController {
  constructor(private readonly links: LinksService) {}

  @Get(':slug')
  @Redirect(undefined, 302)
  async follow(
    @Param('slug') slug: string,
    @Headers('referer') referer: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Headers('x-vercel-ip-country') country: string | undefined,
  ) {
    const url = await this.links.recordClick(slug, {
      referrer: referrerHost(referer),
      country: countryCode(country),
      device: deviceFromUserAgent(userAgent),
    });
    if (!url) throw new NotFoundException(`no link for "${slug}"`);
    return { url };
  }
}
