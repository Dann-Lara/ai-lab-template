/**
 * @deprecated Use createLLM() from ./factory instead.
 * Kept for backward compatibility.
 */
import { createLLM } from './factory';

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
}

export async function getLLM(options: LLMOptions = {}) {
  // Try OpenAI first (old behavior), fall back to any available provider
  const providers = (await import('../providers/registry')).getActiveProviders();
  const provider = providers.find((p) => p.name === 'openai') ?? providers[0];
  if (!provider) throw new Error('No AI provider available');
  return createLLM(provider.name, {
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    model: options.modelName,
  });
}
