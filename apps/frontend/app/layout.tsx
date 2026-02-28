import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter } from 'next/font/google';

import { ThemeProvider } from '../components/ui/ThemeProvider';
import { Navbar } from '../components/ui/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI Lab',
  description: 'Fullstack AI Lab Template — Next.js + NestJS + LangChain + n8n',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.JSX.Element> {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-white dark:bg-slate-900 min-h-screen`}>
        {/*
          next-intl v3: pass messages directly — the library handles serialization internally.
          Do NOT JSON.parse/stringify — that breaks the internal IntlMessages type.
        */}
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <Navbar />
            <main>{children}</main>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
