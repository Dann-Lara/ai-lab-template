import { ChatOpenAI } from '@langchain/openai';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
  streaming?: boolean;
}

export function getLLM(options: LLMOptions = {}): ChatOpenAI {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    modelName = process.env['OPENAI_DEFAULT_MODEL'] ?? 'gpt-4o-mini',
    streaming = false,
  } = options;

  if (!process.env['OPENAI_API_KEY']) {
    throw new Error('OPENAI_API_KEY environment variable is required');
  }

  return new ChatOpenAI({
    modelName,
    temperature,
    maxTokens,
    streaming,
  });
}
