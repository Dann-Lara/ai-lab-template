// Lightweight client-side i18n — no external library, no middleware, no routing changes

export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';
export const LOCALE_COOKIE = 'ai_lab_locale';

// ── Message types ──────────────────────────────────────────────
export interface Messages {
  common: {
    appName: string; loading: string; error: string; retry: string;
    darkMode: string; lightMode: string; language: string;
  };
  nav: { home: string; dashboard: string };
  home: {
    title: string; subtitle: string; openDashboard: string;
    apiDocs: string; n8nWorkflows: string;
    featureAi: string; featureAutomations: string; featureSecurity: string;
  };
  dashboard: { title: string; generatorTitle: string; summarizerTitle: string };
  ai: {
    systemMessage: string; systemMessagePlaceholder: string;
    prompt: string; promptPlaceholder: string; temperature: string;
    generate: string; generating: string; result: string;
    textToSummarize: string; textToSummarizePlaceholder: string;
    summarize: string; summarizing: string; summary: string;
  };
}

// ── Translations ───────────────────────────────────────────────
const translations: Record<Locale, Messages> = {
  es: {
    common: {
      appName: 'AI Lab', loading: 'Cargando...', error: 'Ocurrió un error',
      retry: 'Reintentar', darkMode: 'Modo oscuro', lightMode: 'Modo claro', language: 'Idioma',
    },
    nav: { home: 'Inicio', dashboard: 'Panel' },
    home: {
      title: 'AI Lab Template', subtitle: 'Next.js · NestJS · LangChain · n8n · Turborepo',
      openDashboard: 'Abrir Panel', apiDocs: 'Docs API (Swagger)', n8nWorkflows: 'Flujos n8n',
      featureAi: 'Generación IA', featureAutomations: 'Automatizaciones', featureSecurity: 'Auth y Seguridad',
    },
    dashboard: { title: 'Panel de AI Lab', generatorTitle: 'Generador de Texto', summarizerTitle: 'Resumidor de Texto' },
    ai: {
      systemMessage: 'Mensaje de sistema (opcional)', systemMessagePlaceholder: 'Eres un asistente útil...',
      prompt: 'Prompt', promptPlaceholder: 'Escribe tu prompt aquí...',
      temperature: 'Temperatura', generate: 'Generar', generating: 'Generando...', result: 'Resultado',
      textToSummarize: 'Texto a resumir', textToSummarizePlaceholder: 'Pega el texto que deseas resumir...',
      summarize: 'Resumir', summarizing: 'Resumiendo...', summary: 'Resumen',
    },
  },
  en: {
    common: {
      appName: 'AI Lab', loading: 'Loading...', error: 'An error occurred',
      retry: 'Retry', darkMode: 'Dark mode', lightMode: 'Light mode', language: 'Language',
    },
    nav: { home: 'Home', dashboard: 'Dashboard' },
    home: {
      title: 'AI Lab Template', subtitle: 'Next.js · NestJS · LangChain · n8n · Turborepo',
      openDashboard: 'Open Dashboard', apiDocs: 'API Docs (Swagger)', n8nWorkflows: 'n8n Workflows',
      featureAi: 'AI Generation', featureAutomations: 'Automations', featureSecurity: 'Auth & Security',
    },
    dashboard: { title: 'AI Lab Dashboard', generatorTitle: 'Text Generator', summarizerTitle: 'Text Summarizer' },
    ai: {
      systemMessage: 'System Message (optional)', systemMessagePlaceholder: 'You are a helpful assistant...',
      prompt: 'Prompt', promptPlaceholder: 'Write your prompt here...',
      temperature: 'Temperature', generate: 'Generate', generating: 'Generating...', result: 'Result',
      textToSummarize: 'Text to Summarize', textToSummarizePlaceholder: 'Paste the text you want to summarize...',
      summarize: 'Summarize', summarizing: 'Summarizing...', summary: 'Summary',
    },
  },
};

export function getMessages(locale: Locale): Messages {
  return translations[locale] ?? translations[defaultLocale];
}

export function getStoredLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const stored = match?.[1] as Locale | undefined;
  return stored && locales.includes(stored) ? stored : defaultLocale;
}

export function setStoredLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
