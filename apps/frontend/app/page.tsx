'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useI18n } from '../lib/i18n-context';
import { Navbar } from '../components/ui/Navbar';
import { Footer } from '../components/ui/Footer';

// ── Animated counter hook ──────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, target);
      if (ref.current) ref.current.textContent = Math.floor(start).toString();
      if (start >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return ref;
}

// ── Stack pills ────────────────────────────────────────────────
const STACK = [
  { name: 'Next.js 14',  color: 'text-white',       dot: 'bg-white' },
  { name: 'NestJS',      color: 'text-red-400',      dot: 'bg-red-400' },
  { name: 'LangChain',   color: 'text-emerald-400',  dot: 'bg-emerald-400' },
  { name: 'TypeScript',  color: 'text-sky-400',      dot: 'bg-sky-400' },
  { name: 'PostgreSQL',  color: 'text-blue-400',     dot: 'bg-blue-400' },
  { name: 'Redis',       color: 'text-orange-400',   dot: 'bg-orange-400' },
  { name: 'n8n',         color: 'text-pink-400',     dot: 'bg-pink-400' },
  { name: 'Docker',      color: 'text-cyan-400',     dot: 'bg-cyan-400' },
  { name: 'Turborepo',   color: 'text-yellow-400',   dot: 'bg-yellow-400' },
];

// ── Feature cards ──────────────────────────────────────────────
function FeatureCard({ icon, title, desc, index }: { icon: string; title: string; desc: string; index: number }) {
  return (
    <div className="relative group p-6 border border-slate-800 rounded-xl bg-slate-900/40
                    hover:border-sky-500/40 hover:bg-slate-900/80 transition-all duration-300"
         style={{ animationDelay: `${index * 100}ms` }}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-sky-500/0 to-sky-500/0
                      group-hover:from-sky-500/5 group-hover:to-transparent transition-all duration-500" />
      <div className="relative">
        <span className="text-2xl mb-4 block">{icon}</span>
        <h3 className="font-mono text-sm font-bold text-slate-100 mb-2 uppercase tracking-wider">{title}</h3>
        <p className="font-mono text-[11px] text-slate-500 leading-relaxed">{desc}</p>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-sky-600 opacity-0 group-hover:opacity-100
                      transition-opacity uppercase tracking-widest">
        0{index + 1}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────
export default function LandingPage(): React.JSX.Element {
  const { t } = useI18n();
  const linesRef = useCountUp(4200);
  const filesRef = useCountUp(97);
  const svcRef   = useCountUp(6);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar variant="public" />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section id="hero" className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-14">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px]
                        bg-sky-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1400px] mx-auto px-6 md:px-12 py-24 md:py-32">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 mb-8 font-mono text-[10px] uppercase tracking-[0.3em]
                          text-sky-400 border border-sky-400/20 bg-sky-400/5 rounded-full px-4 py-2
                          animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            {t.home.heroTag}
          </div>

          {/* Headline */}
          <h1 className="headline text-[clamp(4rem,14vw,11rem)] text-white leading-none mb-8
                         animate-slide-up [animation-delay:100ms]">
            {t.home.heroTitle.split('\n').map((line, i) => (
              <span key={i} className={`block ${i === 1 ? 'text-sky-400' : ''}`}>{line}</span>
            ))}
          </h1>

          <div className="max-w-2xl space-y-8 animate-slide-up [animation-delay:200ms]">
            <p className="font-mono text-[13px] text-slate-400 leading-relaxed">
              {t.home.heroSub}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary text-[11px] px-6 py-3">
                {t.home.heroCta} →
              </Link>
              <Link href="/login" className="btn-ghost text-[11px] px-6 py-3">
                {t.nav.login}
              </Link>
              <a href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer"
                className="btn-ghost text-[11px] px-6 py-3 border-slate-700 text-slate-400">
                {t.home.heroCtaSec} ↗
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-6 max-w-sm
                          animate-fade-in [animation-delay:400ms]">
            {[
              { ref: linesRef, suffix: '+', label: 'Lines of code' },
              { ref: filesRef, suffix: '',  label: 'Files' },
              { ref: svcRef,   suffix: '',  label: 'Services' },
            ].map(({ ref, suffix, label }) => (
              <div key={label} className="text-center">
                <div className="font-mono text-2xl font-bold text-sky-400">
                  <span ref={ref}>0</span>{suffix}
                </div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-slate-600 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2
                        font-mono text-[9px] uppercase tracking-widest text-slate-700 animate-bounce">
          <span>scroll</span>
          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
            <path d="M5 1v12M1 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32 border-t border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="mb-16">
            <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.4em] mb-4">— 01</p>
            <h2 className="headline text-5xl md:text-7xl text-white">{t.home.featuresTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard icon="🤖" title={t.home.feat1Title} desc={t.home.feat1Desc} index={0} />
            <FeatureCard icon="🔐" title={t.home.feat2Title} desc={t.home.feat2Desc} index={1} />
            <FeatureCard icon="⚡" title={t.home.feat3Title} desc={t.home.feat3Desc} index={2} />
          </div>
        </div>
      </section>

      {/* ── STACK ───────────────────────────────────────────── */}
      <section id="stack" className="py-24 md:py-32 border-t border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="mb-16">
            <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.4em] mb-4">— 02</p>
            <h2 className="headline text-5xl md:text-7xl text-white">{t.home.stackTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {STACK.map(({ name, color, dot }) => (
              <div key={name}
                className="flex items-center gap-2 px-4 py-2.5 border border-slate-800
                           rounded-lg bg-slate-900/40 hover:border-slate-600 transition-all
                           cursor-default group">
                <span className={`w-1.5 h-1.5 rounded-full ${dot} opacity-60 group-hover:opacity-100 transition-opacity`} />
                <span className={`font-mono text-[11px] ${color} opacity-60 group-hover:opacity-100 transition-opacity uppercase tracking-wider`}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── API DOCS ─────────────────────────────────────────── */}
      <section id="docs" className="py-24 md:py-32 border-t border-slate-800/50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <p className="font-mono text-[10px] text-sky-400 uppercase tracking-[0.4em] mb-4">— 03</p>
              <h2 className="headline text-5xl md:text-7xl text-white">{t.home.docsTitle}</h2>
            </div>
            <a href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer"
              className="btn-ghost text-[11px] px-8 py-4 self-start md:self-auto shrink-0">
              {t.home.docsCta}
            </a>
          </div>
          {/* Terminal preview */}
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-3 font-mono text-[10px] text-slate-600">POST /v1/auth/login</span>
            </div>
            <pre className="p-6 font-mono text-[11px] text-slate-400 overflow-x-auto leading-relaxed">
{`{
  "email": "superadmin@ailab.dev",
  "password": "SuperAdmin123!"
}

// Response:
{
  "accessToken":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn":    604800,
  "user": {
    "id":    "uuid-...",
    "email": "superadmin@ailab.dev",
    "name":  "Super Admin",
    "role":  "superadmin"
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
