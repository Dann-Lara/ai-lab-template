import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';

import { getLLM } from '../llm/openai';

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
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const {
    prompt,
    systemMessage = 'You are a helpful AI assistant.',
    temperature,
    maxTokens,
    model,
  } = options;

  const llm = getLLM({ temperature, maxTokens, modelName: model });
  const outputParser = new StringOutputParser();

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ['system', systemMessage],
    ['human', '{input}'],
  ]);

  const chain = chatPrompt.pipe(llm).pipe(outputParser);

  const text = await chain.invoke({ input: prompt });

  return {
    text,
    model: model ?? process.env['OPENAI_DEFAULT_MODEL'] ?? 'gpt-4o-mini',
  };
}
