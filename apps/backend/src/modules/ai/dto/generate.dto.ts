import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class GenerateDto {
  @ApiProperty({ description: 'The prompt to send to the AI model', minLength: 1, maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  prompt!: string;

  @ApiPropertyOptional({ description: 'System message to set AI behavior' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemMessage?: string;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', minimum: 0, maximum: 2, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Max tokens in response', minimum: 1, maximum: 4096, default: 1024 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4096)
  maxTokens?: number;
}
