/**
 * i18n barrel — merges all translation modules into a single Messages type.
 * Import from this file or from the parent lib/i18n.ts (which re-exports here).
 *
 * Adding a new section:
 *  1. Create apps/frontend/lib/i18n/mySection.ts
 *  2. Export mySectionES, mySectionEN, mySectionTranslations
 *  3. Add the key to Messages and to the merge below
 */

export { locales, defaultLocale, LOCALE_COOKIE, getStoredLocale, setStoredLocale } from './types';
export type { Locale } from './types';

import { commonES, commonEN } from './common';
import { authES, authEN } from './auth';
import { homeES, homeEN } from './home';
import { dashboardES, dashboardEN } from './dashboard';
import { usersES, usersEN } from './users';
import { profileES, profileEN } from './profile';
import { checklistES, checklistEN } from './checklist';
import { telegramES, telegramEN } from './telegram';
import type { Locale } from './types';

// ── Merged type ──────────────────────────────────────────────────────────────
export type Messages =
  typeof commonES &
  typeof authES &
  typeof homeES &
  typeof dashboardES &
  typeof usersES &
  typeof profileES &
  typeof checklistES &
  typeof telegramES;

// ── Merged translations ──────────────────────────────────────────────────────
const es: Messages = {
  ...commonES, ...authES, ...homeES,
  ...dashboardES, ...usersES, ...profileES,
  ...checklistES, ...telegramES,
};

const en: Messages = {
  ...commonEN, ...authEN, ...homeEN,
  ...dashboardEN, ...usersEN, ...profileEN,
  ...checklistEN, ...telegramEN,
};

export const translations: Record<Locale, Messages> = { es, en };

export function getMessages(locale: Locale): Messages {
  return translations[locale] ?? translations['es'];
}
