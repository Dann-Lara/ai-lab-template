import { executeWithFallback } from '../llm/executor';

export interface SummarizeOptions {
  text: string;
  maxLength?: number;
  language?: string;
}

export async function summarizeText(options: SummarizeOptions): Promise<string> {
  const { text, maxLength = 200, language = 'Spanish' } = options;

  const result = await executeWithFallback({
    systemMessage: `You are an expert summarizer. Summarize text concisely in ${language} in under ${maxLength} words.`,
    prompt: `Text to summarize:\n\n${text}`,
    temperature: 0.3,
    maxTokens: 512,
  });

  return result.text;
}
