import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AiService } from './ai.service';
import { GenerateDto } from './dto/generate.dto';
import { SummarizeDto } from './dto/summarize.dto';

@ApiTags('AI')
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate text using AI' })
  @ApiResponse({ status: 200, description: 'Text generated successfully' })
  async generate(@Body() dto: GenerateDto): Promise<{ result: string; model: string }> {
    return this.aiService.generate(dto);
  }

  @Post('summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Summarize text using AI' })
  async summarize(@Body() dto: SummarizeDto): Promise<{ result: string }> {
    return this.aiService.summarize(dto);
  }

  @Get('providers')
  @ApiOperation({ summary: 'List active AI providers and their status' })
  getProviderStatus() {
    return this.aiService.getProviderStatus();
  }
}
