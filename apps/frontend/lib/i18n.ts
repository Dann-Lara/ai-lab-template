/**
 * Main i18n entry point — re-exports everything from lib/i18n/index.ts.
 * All translations live in the lib/i18n/ folder as separate modules.
 * This file exists only to preserve existing import paths.
 */
export {
  locales, defaultLocale, LOCALE_COOKIE,
  getStoredLocale, setStoredLocale,
  getMessages, translations,
} from './i18n/index';
export type { Locale, Messages } from './i18n/index';
