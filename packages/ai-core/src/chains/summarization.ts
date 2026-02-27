import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

import { getLLM } from '../llm/openai';

export interface SummarizeOptions {
  text: string;
  maxLength?: number;
  language?: string;
}

export async function summarizeText(options: SummarizeOptions): Promise<string> {
  const { text, maxLength = 200, language = 'Spanish' } = options;

  const llm = getLLM({ temperature: 0.3 });
  const outputParser = new StringOutputParser();

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert summarizer. Summarize text concisely in ${language} in under ${maxLength} words.`,
    ],
    ['human', 'Text to summarize:\n\n{text}'],
  ]);

  const chain = prompt.pipe(llm).pipe(outputParser);
  return chain.invoke({ text });
}
