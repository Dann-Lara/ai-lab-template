import { executeWithFallback } from '../llm/executor';

export interface GenerateTextOptions {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface GenerateTextResult {
  text: string;
  model: string;
  provider: string;
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const result = await executeWithFallback({
    prompt: options.prompt,
    systemMessage: options.systemMessage ?? 'You are a helpful AI assistant.',
    temperature: options.temperature,
    maxTokens: options.maxTokens ?? 1024,
    model: options.model,
  });

  return {
    text: result.text,
    model: result.model,
    provider: result.provider,
  };
}
