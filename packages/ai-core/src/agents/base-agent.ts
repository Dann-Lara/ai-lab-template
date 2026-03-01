/**
 * Base Agent — provider-agnostic
 * Uses the first available provider that supports tool/function calling.
 * Gemini 1.5+, GPT-4o, Groq Llama-3, DeepSeek-chat all support it.
 */
import { AgentExecutor, createOpenAIFunctionsAgent, createToolCallingAgent } from 'langchain/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import type { Tool } from '@langchain/core/tools';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { getActiveProviders } from '../providers/registry';
import { createLLM } from '../llm/factory';

export interface AgentOptions {
  tools?: Tool[];
  temperature?: number;
}

export async function createBaseAgent(options: AgentOptions = {}): Promise<AgentExecutor> {
  const { tools = [], temperature = 0 } = options;

  const providers = getActiveProviders();
  if (providers.length === 0) {
    throw new Error('No AI providers configured for agent.');
  }

  // Try providers in order until one works for agent creation
  let llm: BaseChatModel | null = null;
  for (const provider of providers) {
    try {
      llm = await createLLM(provider.name, { temperature });
      break;
    } catch { continue; }
  }

  if (!llm) throw new Error('Could not initialize any AI provider for agent.');

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are a helpful AI assistant with access to tools.'],
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ]);

  // createToolCallingAgent works with any model that supports tool use
  const agent = await createToolCallingAgent({ llm, tools, prompt });

  return new AgentExecutor({
    agent,
    tools,
    verbose: process.env['NODE_ENV'] === 'development',
  });
}
