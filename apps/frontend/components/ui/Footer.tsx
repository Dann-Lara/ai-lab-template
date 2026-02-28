'use client';

import Link from 'next/link';
import { useI18n } from '../../lib/i18n-context';

const SOCIAL = [
  { name: 'GitHub', href: 'https://github.com', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  )},
  { name: 'Twitter', href: 'https://twitter.com', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )},
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )},
];

export function Footer(): React.JSX.Element {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-800/50 relative overflow-hidden">
      {/* Bg glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px]
                      bg-sky-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-20 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16">

          {/* Brand */}
          <div className="space-y-5">
            <div className="font-mono text-sky-400 text-xs tracking-widest">
              &gt;_ AI.Lab <span className="text-slate-600">// template</span>
            </div>
            <p className="font-mono text-[10px] text-slate-500 leading-relaxed max-w-[220px]">
              {t.footer.description}
            </p>
            <div className="flex gap-4">
              {SOCIAL.map(({ name, href, icon }) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer"
                  aria-label={name}
                  className="text-slate-600 hover:text-sky-400 transition-all hover:scale-110">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-5">
            <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.3em] opacity-70">
              {t.footer.navTitle}
            </p>
            <ul className="space-y-3">
              {[
                { href: '/', label: t.nav.home },
                { href: '/login', label: t.nav.login },
                { href: '/signup', label: t.nav.signup },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}
                    className="font-mono text-[10px] uppercase tracking-widest text-slate-500
                               hover:text-sky-400 flex items-center gap-2 group transition-colors">
                    <span className="w-0 group-hover:w-3 h-px bg-sky-400 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div className="space-y-5">
            <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.3em] opacity-70">
              {t.footer.stackTitle}
            </p>
            <ul className="space-y-3">
              {['Next.js 14', 'NestJS', 'LangChain', 'n8n', 'TypeScript', 'Docker'].map((tech) => (
                <li key={tech}
                  className="font-mono text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400/40" />{tech}
                </li>
              ))}
            </ul>
          </div>

          {/* Status */}
          <div className="space-y-5">
            <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.3em] opacity-70">
              {t.footer.statusTitle}
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow
                                 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <div>
                  <p className="font-mono text-[10px] text-slate-300 font-bold">{t.footer.statusMsg}</p>
                  <p className="font-mono text-[9px] text-slate-600 uppercase tracking-widest mt-1">
                    {t.footer.location}
                  </p>
                </div>
              </div>
              <div className="font-mono text-[9px] text-slate-700 italic">v1.0.0_build</div>
              <Link href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer"
                className="inline-block font-mono text-[9px] text-sky-600 hover:text-sky-400
                           border border-sky-900/50 hover:border-sky-600/50 rounded px-3 py-1.5
                           transition-all uppercase tracking-widest">
                API Docs →
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row
                        justify-between items-center gap-4">
          <p className="font-mono text-[9px] text-slate-600 uppercase tracking-[0.3em]">
            © {year} AI Lab Template <span className="mx-2 opacity-30">|</span> {t.footer.rights}
          </p>
          <p className="font-mono text-[9px] text-slate-700 uppercase tracking-[0.3em]">
            {t.footer.madeWith} <span className="text-sky-700">♥</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
