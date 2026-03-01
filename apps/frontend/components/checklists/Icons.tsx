// Shared icon set for Checklist feature — no emojis, pure SVG
export function IconCheck({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2.5 7.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconClock({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
export function IconRepeat({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 5h9M9 2l2 3-2 3M12 9H3M5 6l-2 3 2 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconLightbulb({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M7 1.5a3.5 3.5 0 0 1 2 6.3V9.5H5V7.8A3.5 3.5 0 0 1 7 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M5 11h4M5.5 12.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
export function IconTrash({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.5h6.4L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconEdit({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M2 12l2.5-.5 7-7-2-2-7 7L2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconX({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
export function IconChevronDown({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" className={className}>
      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconChevronLeft({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M9 2.5L4 7l5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconPlus({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}
export function IconRefresh({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M12 7A5 5 0 1 1 7 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 1v3.5H3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconSparkle({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M7 1.5L8 5.5l4 1-4 1-1 4-1-4-4-1 4-1 1-4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}
export function IconPostpone({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M10.5 11.5l1.5 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
export function IconProgress({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="1.5" y="8" width="2.5" height="4.5" rx="0.5" fill="currentColor" opacity="0.4"/>
      <rect x="5.75" y="5" width="2.5" height="7.5" rx="0.5" fill="currentColor" opacity="0.7"/>
      <rect x="10" y="1.5" width="2.5" height="11" rx="0.5" fill="currentColor"/>
    </svg>
  );
}
export function IconBrain({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M5 7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M3.5 5C3 3.3 4 2 5.5 2c.7 0 1.3.3 1.5.7M8.5 5C9 3.3 8 2 6.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M3.5 9C3 10.7 4 12 5.5 12H8.5C10 12 11 10.7 10.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M2 7c-.5-1 0-2.5 1.5-3M12 7c.5-1 0-2.5-1.5-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
export function IconPause({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <rect x="3" y="2.5" width="2.5" height="9" rx="0.5" fill="currentColor"/>
      <rect x="8.5" y="2.5" width="2.5" height="9" rx="0.5" fill="currentColor"/>
    </svg>
  );
}
export function IconPlay({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M3.5 2.5l8 4.5-8 4.5V2.5z" fill="currentColor"/>
    </svg>
  );
}
export function IconList({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <path d="M5 4h7M5 7h7M5 10h7M2 4h.5M2 7h.5M2 10h.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
export function IconDrag({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="4.5" cy="4" r="1.2" fill="currentColor"/>
      <circle cx="9.5" cy="4" r="1.2" fill="currentColor"/>
      <circle cx="4.5" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="9.5" cy="7" r="1.2" fill="currentColor"/>
      <circle cx="4.5" cy="10" r="1.2" fill="currentColor"/>
      <circle cx="9.5" cy="10" r="1.2" fill="currentColor"/>
    </svg>
  );
}
