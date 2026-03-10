import {
  IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString,
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
  /** CV quality score returned by the evaluate endpoint — must be >= 85 to save */
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) @Max(100) cvScore?: number;
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
  @IsOptional() @IsString() generatedCvTextEs?: string;
  @IsOptional() @IsString() generatedCvTextEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) appliedFrom?: string;
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
  @IsOptional() @IsString() generatedCvTextEs?: string;
  @IsOptional() @IsString() generatedCvTextEn?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) appliedFrom?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interviewQuestions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interviewAnswers?: string;
}

// ── Generate CV (AI) ──────────────────────────────────────────────────────────
export class GenerateCvDto {
  @ApiProperty({ description: 'Target company' })
  @IsString() @MinLength(1) @MaxLength(200) company!: string;

  @ApiProperty({ description: 'Target position' })
  @IsString() @MinLength(1) @MaxLength(200) position!: string;

  @ApiProperty({ description: 'Full job offer / description text' })
  @IsString() @MinLength(10) jobOffer!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lang?: string;
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
  /** UI language — 'es' or 'en'. AI feedback will be in this language. */
  @ApiPropertyOptional() @IsOptional() @IsString() lang?: string;
  /**
   * Fields already approved in a prior evaluation.
   * The evaluator must keep their score and set their feedback to "".
   * Accepted keys: contact | linkedIn | summary | experience | skills | education | languages | certifications
   */
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) approvedFields?: string[];
}

export interface CvEvaluationResult {
  score: number; // 0-100
  fieldFeedback: Record<string, string>; // per-field tip
  summary: string; // overall one-liner
  approved: boolean; // score >= 85
}

// ── Answer interview questions (AI) ─────────────────────────────────────────
export class AnswerInterviewDto {
  @ApiProperty({ description: 'Application id' })
  @IsString() @MinLength(1) applicationId!: string;

  @ApiProperty({ description: 'Raw interview questions text (one per line or numbered)' })
  @IsString() @MinLength(5) questions!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() lang?: string;
}
