import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database.module.js';
import { LinksModule } from './links/links.module.js';

@Module({
  imports: [DatabaseModule, LinksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
