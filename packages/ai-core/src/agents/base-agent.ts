import { ChatOpenAI } from '@langchain/openai';
import { AgentExecutor, createOpenAIFunctionsAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import type { Tool } from '@langchain/core/tools';

export interface AgentOptions {
  tools?: Tool[];
  temperature?: number;
}

export async function createBaseAgent(
  options: AgentOptions = {},
): Promise<AgentExecutor> {
  const { tools = [], temperature = 0 } = options;

  const llm = new ChatOpenAI({ temperature });

  // Pull standard ReAct prompt from LangChain Hub
  const prompt = await pull<any>('hwchase17/openai-functions-agent');

  const agent = await createOpenAIFunctionsAgent({ llm, tools, prompt });

  return new AgentExecutor({ agent, tools, verbose: process.env['NODE_ENV'] === 'development' });
}
