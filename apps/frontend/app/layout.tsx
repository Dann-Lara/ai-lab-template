import type { Metadata } from 'next';
import { Bebas_Neue, Space_Mono, Inter_Tight } from 'next/font/google';
import { I18nProvider } from '../lib/i18n-context';
import { ThemeProvider, ThemeScript } from '../components/ui/ThemeProvider';
import './globals.css';

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});
const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'AI Lab', template: '%s | AI Lab' },
  description: 'Fullstack AI Lab Template — Next.js + NestJS + LangChain + n8n',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      {/*
        suppressHydrationWarning on body:
        - Prevents hydration errors from i18n text (server=ES, client cookie=EN)
        - Same pattern used by next-themes library
        - Safe: only suppresses the immediate element's attribute mismatches,
          not the entire subtree
      */}
      <body
        suppressHydrationWarning
        className={`${bebasNeue.variable} ${spaceMono.variable} ${interTight.variable} font-sans`}
      >
        <I18nProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
