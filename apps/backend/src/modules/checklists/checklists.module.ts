import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChecklistEntity, ChecklistItemEntity, ChecklistFeedbackEntity,
} from './entities/checklist.entity';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { JwtOrWebhookSecretGuard } from '../auth/guards/jwt-or-webhook.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ChecklistEntity, ChecklistItemEntity, ChecklistFeedbackEntity,
    ]),
  ],
  providers: [ChecklistsService, JwtOrWebhookSecretGuard, JwtAuthGuard],
  controllers: [ChecklistsController],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
