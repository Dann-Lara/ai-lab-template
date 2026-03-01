/**
 * AI Provider Registry
 * ─────────────────────
 * Providers are tried in priority order (lowest number = tried first).
 * If a provider fails with an "exhausted/auth/quota" error, the next is tried automatically.
 * Add new providers by adding an entry here + implementing a factory in /llm/.
 *
 * Environment variables drive which providers are active:
 *   GEMINI_API_KEY        → Google Gemini (gemini-1.5-flash / gemini-1.5-pro)
 *   OPENAI_API_KEY        → OpenAI (gpt-4o-mini / gpt-4o)
 *   GROQ_API_KEY          → Groq (llama-3.1-70b-versatile) — extremely fast, free tier
 *   DEEPSEEK_API_KEY      → DeepSeek (deepseek-chat) — OpenAI-compatible endpoint
 *   ANTHROPIC_API_KEY     → Anthropic Claude (claude-3-haiku)
 *
 * Priority can be overridden via AI_PROVIDER_PRIORITY env var:
 *   AI_PROVIDER_PRIORITY=gemini,groq,openai
 */

export type ProviderName = 'gemini' | 'openai' | 'groq' | 'deepseek' | 'anthropic';

export interface ProviderConfig {
  name: ProviderName;
  priority: number;        // lower = tried first
  envKey: string;          // which env var enables this provider
  defaultModel: string;
  modelEnvKey: string;     // env var to override the model
  available: () => boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'gemini',
    priority: 1,
    envKey: 'GEMINI_API_KEY',
    defaultModel: 'gemini-2.0-flash',
    modelEnvKey: 'GEMINI_DEFAULT_MODEL',
    available: () => !!process.env['GEMINI_API_KEY'],
  },
  {
    name: 'groq',
    priority: 2,
    envKey: 'GROQ_API_KEY',
    defaultModel: 'llama-3.3-70b-versatile',
    modelEnvKey: 'GROQ_DEFAULT_MODEL',
    available: () => !!process.env['GROQ_API_KEY'],
  },
  {
    name: 'openai',
    priority: 3,
    envKey: 'OPENAI_API_KEY',
    defaultModel: 'gpt-4o-mini',
    modelEnvKey: 'OPENAI_DEFAULT_MODEL',
    available: () => !!process.env['OPENAI_API_KEY'],
  },
  {
    name: 'deepseek',
    priority: 4,
    envKey: 'DEEPSEEK_API_KEY',
    defaultModel: 'deepseek-chat',
    modelEnvKey: 'DEEPSEEK_DEFAULT_MODEL',
    available: () => !!process.env['DEEPSEEK_API_KEY'],
  },
  {
    name: 'anthropic',
    priority: 5,
    envKey: 'ANTHROPIC_API_KEY',
    defaultModel: 'claude-3-haiku-20240307',
    modelEnvKey: 'ANTHROPIC_DEFAULT_MODEL',
    available: () => !!process.env['ANTHROPIC_API_KEY'],
  },
];

/**
 * Returns providers sorted by effective priority.
 * Respects AI_PROVIDER_PRIORITY env var for custom ordering.
 * Only returns providers that have their API key set.
 */
export function getActiveProviders(): ProviderConfig[] {
  const customOrder = process.env['AI_PROVIDER_PRIORITY'];

  let sorted: ProviderConfig[];

  if (customOrder) {
    const order = customOrder.split(',').map((s) => s.trim() as ProviderName);
    const byName = new Map(PROVIDERS.map((p) => [p.name, p]));
    // First: explicitly ordered providers (if available)
    const explicit = order
      .map((name) => byName.get(name))
      .filter((p): p is ProviderConfig => !!p && p.available());
    // Then: remaining available providers by default priority
    const explicitNames = new Set(order);
    const rest = PROVIDERS
      .filter((p) => !explicitNames.has(p.name) && p.available())
      .sort((a, b) => a.priority - b.priority);
    sorted = [...explicit, ...rest];
  } else {
    sorted = PROVIDERS.filter((p) => p.available()).sort((a, b) => a.priority - b.priority);
  }

  return sorted;
}

/**
 * True if the error indicates the provider is exhausted/unavailable
 * (quota, billing, rate limit, auth) so we should try the next one.
 */
export function isExhaustedError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error).toLowerCase();
  return (
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('429') ||
    msg.includes('insufficient_quota') ||
    msg.includes('billing') ||
    msg.includes('exceeded') ||
    msg.includes('credits') ||
    msg.includes('deactivated') ||
    msg.includes('invalid_api_key') ||
    msg.includes('unauthorized') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('resource_exhausted') ||
    msg.includes('api key') ||
    msg.includes('apikey') ||
    // Billing / balance issues — treat as exhausted, try next provider
    msg.includes('402') ||
    msg.includes('insufficient balance') ||
    msg.includes('insufficient_balance') ||
    msg.includes('payment required') ||
    // Model not found / wrong model string — treat as provider config error, try next
    msg.includes('404') ||
    msg.includes('not found for api version') ||
    msg.includes('is not supported for generatecontent') ||
    msg.includes('model not found') ||
    // Provider down
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('overloaded')
  );
}
