import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';

import { AiService } from './ai.service';

jest.mock('@ai-lab/ai-core', () => ({
  generateText: jest.fn().mockResolvedValue({ text: 'AI response', model: 'gpt-4o-mini' }),
  summarizeText: jest.fn().mockResolvedValue('Summary text'),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();
    service = module.get<AiService>(AiService);
  });

  describe('generate', () => {
    it('should return generated text', async () => {
      const result = await service.generate({ prompt: 'Test prompt' });
      expect(result.result).toBe('AI response');
      expect(result.model).toBe('gpt-4o-mini');
    });

    it('should throw InternalServerErrorException on failure', async () => {
      const { generateText } = require('@ai-lab/ai-core');
      generateText.mockRejectedValueOnce(new Error('OpenAI error'));
      await expect(service.generate({ prompt: 'Test' })).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
