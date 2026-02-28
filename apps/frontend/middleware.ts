import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  // 'never' = no URL prefix for any locale (/dashboard for both ES and EN)
  // Locale is stored in the Accept-Language header / cookie automatically by next-intl
  localePrefix: 'never',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
