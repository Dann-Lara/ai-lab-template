import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SummarizeDto {
  @ApiProperty({ description: 'Text to summarize' })
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  text!: string;

  @ApiPropertyOptional({ description: 'Max words in summary', default: 200 })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(1000)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Language for summary', default: 'Spanish' })
  @IsOptional()
  @IsString()
  language?: string;
}
