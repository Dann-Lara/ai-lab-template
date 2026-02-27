import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { generateText, summarizeText } from '@ai-lab/ai-core';

import type { GenerateDto } from './dto/generate.dto';
import type { SummarizeDto } from './dto/summarize.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async generate(dto: GenerateDto): Promise<{ result: string; model: string }> {
    try {
      const { text, model } = await generateText({
        prompt: dto.prompt,
        systemMessage: dto.systemMessage,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      });
      return { result: text, model };
    } catch (error) {
      this.logger.error('AI generation failed', error);
      throw new InternalServerErrorException('Failed to generate AI response');
    }
  }

  async summarize(dto: SummarizeDto): Promise<{ result: string }> {
    try {
      const result = await summarizeText({
        text: dto.text,
        maxLength: dto.maxLength,
        language: dto.language,
      });
      return { result };
    } catch (error) {
      this.logger.error('AI summarization failed', error);
      throw new InternalServerErrorException('Failed to summarize text');
    }
  }
}
