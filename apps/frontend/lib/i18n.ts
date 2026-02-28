import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is supported
  if (!locales.includes(locale as Locale)) notFound();

  // require() returns a plain CJS object — avoids ES module wrapper prototype issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const messages = require(`../messages/${locale}.json`) as Record<string, unknown>;

  return { messages };
});
