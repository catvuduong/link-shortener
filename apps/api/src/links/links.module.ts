import { Module } from '@nestjs/common';
import { DemoSeedService } from './demo-seed.service.js';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { RedirectController } from './redirect.controller.js';

@Module({
  controllers: [LinksController, RedirectController],
  providers: [LinksService, DemoSeedService],
})
export class LinksModule {}
