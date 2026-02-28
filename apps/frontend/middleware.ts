import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './lib/i18n';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // /es/dashboard  but just /dashboard for default (es)
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
