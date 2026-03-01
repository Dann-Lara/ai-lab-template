export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'es';
export const LOCALE_COOKIE = 'ai_lab_locale';

export function getStoredLocale(): Locale {
  if (typeof document === 'undefined') return defaultLocale;
  const m = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const s = m?.[1] as Locale | undefined;
  return s && locales.includes(s) ? s : defaultLocale;
}

export function setStoredLocale(locale: Locale): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}
