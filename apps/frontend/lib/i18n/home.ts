import type { Locale } from './types';

export const homeES = {
  home: {
    heroTag: 'v1.0 — Listo para construir',
    heroTitle: 'AI Lab\nTemplate',
    heroSub: 'Monorepo fullstack con IA, automatización y auth robusto. Next.js · NestJS · LangChain · n8n',
    heroCta: 'Abrir Panel', heroCtaSec: 'Ver Docs',
    featuresTitle: 'Capacidades',
    feat1Title: 'IA Integrada',
    feat1Desc: 'GPT-4o-mini via LangChain con chains de generación, resumen y agentes personalizables.',
    feat2Title: 'Auth Robusto',
    feat2Desc: 'JWT + Refresh tokens. Roles: superadmin, admin, cliente. Guards de autorización por ruta.',
    feat3Title: 'Automatización',
    feat3Desc: 'n8n integrado con webhooks bidireccionales. Flujos de trabajo sin código, listos para producción.',
    stackTitle: 'Stack Tecnológico',
    docsTitle: 'Documentación API', docsCta: 'Abrir Swagger →',
  },
} as const;

export const homeEN = {
  home: {
    heroTag: 'v1.0 — Ready to build',
    heroTitle: 'AI Lab\nTemplate',
    heroSub: 'Fullstack monorepo with AI, automation and robust auth. Next.js · NestJS · LangChain · n8n',
    heroCta: 'Open Dashboard', heroCtaSec: 'View Docs',
    featuresTitle: 'Capabilities',
    feat1Title: 'AI Built-in',
    feat1Desc: 'GPT-4o-mini via LangChain with generation, summarization chains and customizable agents.',
    feat2Title: 'Robust Auth',
    feat2Desc: 'JWT + Refresh tokens. Roles: superadmin, admin, client. Route-level authorization guards.',
    feat3Title: 'Automation',
    feat3Desc: 'n8n integrated with bidirectional webhooks. No-code workflows, production-ready.',
    stackTitle: 'Tech Stack',
    docsTitle: 'API Documentation', docsCta: 'Open Swagger →',
  },
} as const;

export const homeTranslations: Record<Locale, typeof homeES> = { es: homeES, en: homeEN };
