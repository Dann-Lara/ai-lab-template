import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { I18nProvider } from '../lib/i18n-context';
import { ThemeProvider } from '../components/ui/ThemeProvider';
import { Navbar } from '../components/ui/Navbar';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AI Lab',
  description: 'Fullstack AI Lab Template — Next.js + NestJS + LangChain + n8n',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-white dark:bg-slate-900 min-h-screen`}>
        <I18nProvider>
          <ThemeProvider>
            <Navbar />
            <main>{children}</main>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
