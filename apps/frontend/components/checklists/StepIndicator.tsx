'use client';
import { useEffect, useRef } from 'react';

interface Props {
  steps: string[];
  current: number; // 0-indexed
}

export function StepIndicator({ steps, current }: Props) {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pct = steps.length <= 1 ? 0 : (current / (steps.length - 1)) * 100;
    if (lineRef.current) {
      lineRef.current.style.width = `${pct}%`;
    }
  }, [current, steps.length]);

  return (
    <div className="w-full mb-10">
      <div className="relative flex items-center justify-between">
        {/* Track */}
        <div className="absolute left-0 right-0 h-px bg-slate-200 dark:bg-slate-800 top-1/2 -translate-y-1/2" />
        {/* Progress line */}
        <div
          ref={lineRef}
          className="absolute left-0 h-px bg-sky-500 dark:bg-sky-400 top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
          style={{ width: '0%' }}
        />
        {steps.map((label, i) => (
          <div key={label} className="relative flex flex-col items-center gap-2 z-10">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center
              font-mono text-[10px] font-bold transition-all duration-500 border
              ${i < current
                ? 'bg-sky-500 dark:bg-sky-500 border-sky-500 text-white scale-100'
                : i === current
                  ? 'bg-sky-500 dark:bg-sky-500 border-sky-500 text-white scale-110 ring-4 ring-sky-500/20'
                  : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-400'
              }`}>
              {i < current ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (i + 1)}
            </div>
            <span className={`font-mono text-[9px] uppercase tracking-[0.2em] hidden sm:block whitespace-nowrap
              ${i === current ? 'text-sky-600 dark:text-sky-400' : i < current ? 'text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
