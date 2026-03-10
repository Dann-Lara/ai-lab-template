/**
 * LLM Factory
 * ────────────
 * Creates the appropriate LangChain chat model for each provider.
 * Returns a BaseChatModel — all providers share the same interface.
 */
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ProviderName } from '../providers/registry';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;      // override the provider's default model
}

export async function createLLM(
  provider: ProviderName,
  options: LLMOptions = {},
): Promise<BaseChatModel> {
  const { temperature = 0.7, maxTokens = 1024 } = options;

  switch (provider) {
    case 'gemini': {
      const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
      const model = options.model ?? process.env['GEMINI_DEFAULT_MODEL'] ?? 'gemini-2.0-flash';
      return new ChatGoogleGenerativeAI({
        apiKey: process.env['GEMINI_API_KEY']!,
        model,
        temperature,
        maxOutputTokens: maxTokens,
      });
    }

    case 'openai': {
      const { ChatOpenAI } = await import('@langchain/openai');
      const model = options.model ?? process.env['OPENAI_DEFAULT_MODEL'] ?? 'gpt-4o-mini';
      return new ChatOpenAI({
        apiKey: process.env['OPENAI_API_KEY']!,
        modelName: model,
        temperature,
        maxTokens,
      });
    }

    case 'groq': {
      // Groq is OpenAI-compatible — use ChatOpenAI with custom baseURL
      const { ChatOpenAI } = await import('@langchain/openai');
      const model = options.model ?? process.env['GROQ_DEFAULT_MODEL'] ?? 'llama-3.1-70b-versatile';
      return new ChatOpenAI({
        apiKey: process.env['GROQ_API_KEY']!,
        modelName: model,
        temperature,
        maxTokens,
        configuration: {
          baseURL: 'https://api.groq.com/openai/v1',
        },
      });
    }

    case 'deepseek': {
      // DeepSeek is also OpenAI-compatible
      const { ChatOpenAI } = await import('@langchain/openai');
      const model = options.model ?? process.env['DEEPSEEK_DEFAULT_MODEL'] ?? 'deepseek-chat';
      return new ChatOpenAI({
        apiKey: process.env['DEEPSEEK_API_KEY']!,
        modelName: model,
        temperature,
        maxTokens,
        configuration: {
          baseURL: 'https://api.deepseek.com/v1',
        },
      });
    }

    case 'anthropic': {
      // Anthropic via OpenAI-compatible layer (or native @langchain/anthropic)
      // Using OpenAI-compat to avoid extra dep; swap to @langchain/anthropic if preferred
      const { ChatOpenAI } = await import('@langchain/openai');
      const model = options.model ?? process.env['ANTHROPIC_DEFAULT_MODEL'] ?? 'claude-3-haiku-20240307';
      return new ChatOpenAI({
        apiKey: process.env['ANTHROPIC_API_KEY']!,
        modelName: model,
        temperature,
        maxTokens,
        configuration: {
          baseURL: 'https://api.anthropic.com/v1',
          defaultHeaders: { 'anthropic-version': '2023-06-01' },
        },
      });
    }

    default:
      throw new Error(`Unknown AI provider: ${String(provider)}`);
  }
}
