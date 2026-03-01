import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChecklistEntity, ChecklistItemEntity, ChecklistFeedbackEntity,
} from './entities/checklist.entity';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChecklistEntity, ChecklistItemEntity, ChecklistFeedbackEntity,
    ]),
  ],
  providers: [ChecklistsService],
  controllers: [ChecklistsController],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
