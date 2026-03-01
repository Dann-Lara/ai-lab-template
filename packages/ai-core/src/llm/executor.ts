/**
 * AI Executor — Provider Fallback Chain
 * ──────────────────────────────────────
 * Tries each configured provider in priority order.
 * Falls through to the next provider automatically on:
 *   - Quota/rate limit exceeded
 *   - Invalid API key / billing issue
 *   - Service unavailable (5xx)
 *
 * Does NOT fall through on:
 *   - Prompt validation errors
 *   - Content policy violations
 *   - Malformed request (4xx except 401/403/429)
 *
 * Usage:
 *   const { text, provider, model } = await executeWithFallback({ prompt });
 */
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { getActiveProviders, isExhaustedError, type ProviderName } from '../providers/registry';
import { createLLM, type LLMOptions } from './factory';

export interface ExecuteOptions extends LLMOptions {
  prompt: string;
  systemMessage?: string;
}

export interface ExecuteResult {
  text: string;
  provider: ProviderName;
  model: string;
}

// ── Logger (uses process.env to avoid NestJS dependency in this package) ────
function log(level: 'info' | 'warn' | 'error', msg: string) {
  const ts = new Date().toISOString();
  const prefix = `[AI-Core][${level.toUpperCase()}] ${ts}`;
  if (level === 'error') console.error(prefix, msg);
  else if (level === 'warn') console.warn(prefix, msg);
  else console.log(prefix, msg);
}

export async function executeWithFallback(options: ExecuteOptions): Promise<ExecuteResult> {
  const {
    prompt,
    systemMessage = 'You are a helpful AI assistant.',
    temperature,
    maxTokens,
    model,
  } = options;

  const providers = getActiveProviders();

  if (providers.length === 0) {
    throw new Error(
      'No AI providers configured. Set at least one of: GEMINI_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY, ANTHROPIC_API_KEY',
    );
  }

  const outputParser = new StringOutputParser();
  const errors: string[] = [];

  for (const providerConfig of providers) {
    const providerModel = model ?? process.env[providerConfig.modelEnvKey] ?? providerConfig.defaultModel;

    try {
      log('info', `Trying provider: ${providerConfig.name} (${providerModel})`);

      const llm = await createLLM(providerConfig.name, { temperature, maxTokens, model: providerModel });

      const chatPrompt = ChatPromptTemplate.fromMessages([
        ['system', systemMessage],
        ['human', '{input}'],
      ]);

      const chain = chatPrompt.pipe(llm).pipe(outputParser);
      const text = await chain.invoke({ input: prompt });

      log('info', `Success: ${providerConfig.name} (${providerModel})`);
      return { text, provider: providerConfig.name, model: providerModel };

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`${providerConfig.name}: ${errMsg}`);

      if (isExhaustedError(err)) {
        log('warn', `Provider ${providerConfig.name} exhausted/unavailable (${errMsg}), trying next...`);
        continue; // → try next provider
      }

      // Non-recoverable error (bad prompt, content policy, etc.) — don't try other providers
      log('error', `Provider ${providerConfig.name} failed with non-recoverable error: ${errMsg}`);
      throw err;
    }
  }

  // All providers failed
  const summary = errors.join(' | ');
  log('error', `All AI providers failed: ${summary}`);
  throw new Error(`All AI providers failed. Errors: ${summary}`);
}
