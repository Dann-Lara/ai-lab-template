import {
  IsEnum, IsInt, IsOptional, IsString,
  Max, MaxLength, Min, MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ApplicationStatus } from '../entities/application.entity';

// ── Base CV ───────────────────────────────────────────────────────────────────
export class UpsertBaseCvDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)  phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150) location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) linkedIn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() summary?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() experience?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() education?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() skills?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(250) languages?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certifications?: string;
}

// ── Create Application ────────────────────────────────────────────────────────
export class CreateApplicationDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) company!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(200) position!: string;
  @ApiProperty() @IsString() @MinLength(10) jobOffer!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) @Max(100) atsScore?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() generatedCvText?: string;

  @ApiPropertyOptional()
  @IsOptional() cvGenerated?: boolean;
}

// ── Patch Application (status update) ────────────────────────────────────────
export class PatchApplicationDto {
  @ApiPropertyOptional({ enum: ['pending', 'in_process', 'accepted', 'rejected'] })
  @IsOptional()
  @IsEnum(['pending', 'in_process', 'accepted', 'rejected'])
  status?: ApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional() @IsInt() @Min(0) @Max(100) atsScore?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() generatedCvText?: string;
}

// ── Generate CV (AI) ──────────────────────────────────────────────────────────
export class GenerateCvDto {
  @ApiProperty({ description: 'Target company' })
  @IsString() @MinLength(1) @MaxLength(200) company!: string;

  @ApiProperty({ description: 'Target position' })
  @IsString() @MinLength(1) @MaxLength(200) position!: string;

  @ApiProperty({ description: 'Full job offer / description text' })
  @IsString() @MinLength(10) jobOffer!: string;
}

// ── Extract CV from text (PDF text already extracted client-side) ─────────────
export class ExtractCvDto {
  @ApiProperty({ description: 'Raw text extracted from the PDF' })
  @IsString() @MinLength(10) pdfText!: string;
}

// ── Evaluate Base CV (AI) ─────────────────────────────────────────────────────
export class EvaluateCvDto {
  @ApiProperty() @IsString() @MinLength(1) fullName!: string;
  @ApiProperty() @IsString() @MinLength(1) email!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() linkedIn?: string;
  @ApiProperty() @IsString() @MinLength(10) summary!: string;
  @ApiProperty() @IsString() @MinLength(10) experience!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() education?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() skills?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() languages?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() certifications?: string;
}

export interface CvEvaluationResult {
  score: number; // 0-100
  fieldFeedback: Record<string, string>; // per-field tip
  summary: string; // overall one-liner
  approved: boolean; // score >= 85
}
