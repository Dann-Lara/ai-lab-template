import type { Metadata } from 'next';
import { Space_Mono, Bebas_Neue, Inter_Tight } from 'next/font/google';
import { I18nProvider } from '../lib/i18n-context';
import { ThemeProvider } from '../components/ui/ThemeProvider';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html suppressHydrationWarning className="dark">
      <body className={`${bebasNeue.variable} ${spaceMono.variable} ${interTight.variable} font-sans`}>
        <I18nProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
