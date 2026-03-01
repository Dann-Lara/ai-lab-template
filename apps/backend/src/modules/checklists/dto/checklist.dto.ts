import {
  IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsObject,
  IsOptional, IsString, MaxLength, Min, Max, ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  Difficulty, TaskStyle, RecurrencePattern, TaskFrequency, TaskStatus,
  ReminderPreferences,
} from '../entities/checklist.entity';

// ── Reminder sub-DTO ─────────────────────────────────────────────────────────
class ReminderPreferencesDto implements ReminderPreferences {
  @IsString() @IsNotEmpty() time!: string; // "HH:MM"
  @IsArray() @IsString({ each: true }) days!: string[];
  @IsEnum(['daily', 'weekly', 'custom']) frequency!: 'daily' | 'weekly' | 'custom';
}

// ── Create Checklist (questionnaire params) ──────────────────────────────────
export class CreateChecklistParamsDto {
  @ApiProperty({ example: 'Mejorar mi inglés en 3 meses' })
  @IsString() @IsNotEmpty() @MaxLength(100) title!: string;

  @ApiProperty({ example: 'Alcanzar nivel B2 conversacional' })
  @IsString() @IsNotEmpty() @MaxLength(500) objective!: string;

  @ApiPropertyOptional({ example: 'Aprendizaje' })
  @IsOptional() @IsString() @MaxLength(50) category?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString() startDate!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString() endDate!: string;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  @IsEnum(['low', 'medium', 'high']) difficulty!: Difficulty;

  @ApiProperty({ example: 30 })
  @IsInt() @Min(1) @Max(1440) dailyTimeAvailable!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsObject() @ValidateNested()
  @Type(() => ReminderPreferencesDto)
  reminderPreferences?: ReminderPreferencesDto;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isRecurring?: boolean;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly'] })
  @IsOptional() @IsEnum(['daily', 'weekly', 'monthly']) recurrencePattern?: RecurrencePattern;

  @ApiPropertyOptional({ example: 'Leer 5 libros' })
  @IsOptional() @IsString() @MaxLength(200) goalMetric?: string;

  @ApiProperty({ enum: ['micro-habits', 'concrete-tasks', 'mixed'] })
  @IsEnum(['micro-habits', 'concrete-tasks', 'mixed']) style!: TaskStyle;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50) telegramChatId?: string;
  @ApiPropertyOptional({ example: 'es' }) @IsOptional() @IsString() @MaxLength(5) language?: string;
}

// ── Single AI-generated item ─────────────────────────────────────────────────
export class ChecklistItemDraftDto {
  @IsString() @IsNotEmpty() description!: string;
  @IsEnum(['once', 'daily', 'weekly', 'custom']) frequency!: TaskFrequency;
  @IsOptional() @IsInt() @Min(1) customFrequencyDays?: number;
  @IsInt() @Min(1) @Max(480) estimatedDuration!: number;
  @IsString() @IsNotEmpty() @MaxLength(200) hack!: string;
  @IsOptional() @IsInt() @Min(0) order?: number;
}

// ── Confirm Checklist ────────────────────────────────────────────────────────
export class ConfirmChecklistDto {
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDraftDto)
  @IsArray()
  finalItems!: ChecklistItemDraftDto[];

  // The original parameters are re-sent so backend can validate & save atomically
  @ValidateNested() @Type(() => CreateChecklistParamsDto)
  parameters!: CreateChecklistParamsDto;
}

// ── Regenerate draft ─────────────────────────────────────────────────────────
export class RegenerateDraftDto {
  @ValidateNested() @Type(() => CreateChecklistParamsDto)
  parameters!: CreateChecklistParamsDto;

  @IsString() @IsNotEmpty() @MaxLength(1000)
  feedback!: string;
}

// ── Patch item ───────────────────────────────────────────────────────────────
export class PatchItemDto {
  @IsEnum(['complete', 'postpone', 'skip'])
  action!: 'complete' | 'postpone' | 'skip';

  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsEnum(['pending', 'completed', 'skipped']) status?: TaskStatus;
}

// ── Patch checklist status ───────────────────────────────────────────────────
export class PatchChecklistDto {
  @IsOptional() @IsEnum(['active', 'paused', 'completed']) status?: 'active' | 'paused' | 'completed';
  @IsOptional() @IsString() @MaxLength(100) title?: string;
}
