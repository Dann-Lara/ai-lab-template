import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { ChecklistsModule } from '../checklists/checklists.module';

@Module({
  imports: [HttpModule, ChecklistsModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
