'use client';
import { useEffect, useRef } from 'react';

interface Props {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({
  value, size = 80, stroke = 6,
  color = '#38bdf8', label,
}: Props) {
  const circleRef = useRef<SVGCircleElement>(null);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (!circleRef.current) return;
    const offset = circ - (value / 100) * circ;
    circleRef.current.style.strokeDashoffset = String(offset);
  }, [value, circ]);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="currentColor" strokeWidth={stroke}
          className="text-slate-100 dark:text-slate-800" />
        <circle ref={circleRef} cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          style={{
            strokeDasharray: circ,
            strokeDashoffset: circ,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
          }} />
      </svg>
      <div className="absolute font-mono text-xs font-bold text-slate-800 dark:text-white"
        style={{ marginTop: -size / 2 - 8 }}>
      </div>
      {label && <p className="font-mono text-[9px] uppercase tracking-widest text-slate-400">{label}</p>}
      <p className="font-mono text-lg font-bold text-slate-800 dark:text-white -mt-1">{value}%</p>
    </div>
  );
}

export function BarChart({ data, label }: {
  data: Array<{ date: string; count: number }>; label: string
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-400 mb-4">{label}</p>
      <div className="flex items-end gap-1 h-20">
        {data.map(({ date, count }) => {
          const h = (count / max) * 100;
          const day = new Date(date).getDate();
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full flex items-end justify-center" style={{ height: '72px' }}>
                {count > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 mx-0.5
                                  bg-sky-400 dark:bg-sky-500 rounded-sm opacity-80
                                  group-hover:opacity-100 transition-all duration-300
                                  group-hover:bg-sky-500 dark:group-hover:bg-sky-400"
                    style={{ height: `${h}%`, minHeight: '3px' }} />
                )}
                {count === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 mx-0.5
                                  bg-slate-100 dark:bg-slate-800 rounded-sm" style={{ height: '3px' }} />
                )}
              </div>
              <span className="font-mono text-[8px] text-slate-400">{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
