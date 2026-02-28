'use client';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

interface UseAnimeOptions {
  /** Delay before animation starts (ms) */
  delay?: number;
  /** Animation duration (ms) */
  duration?: number;
  /** Easing function */
  easing?: string;
}

/**
 * Fade-in + slide-up entrance animation using Anime.js.
 * Returns a ref to attach to the target element.
 */
export function useFadeInUp<T extends HTMLElement>(
  options: UseAnimeOptions = {},
): RefObject<T> {
  const ref = useRef<T>(null);
  const { delay = 0, duration = 600, easing = 'easeOutExpo' } = options;

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    // Set initial state
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const anime = (await import('animejs')).default;
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [20, 0],
        duration,
        easing,
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [delay, duration, easing]);

  return ref;
}

/**
 * Stagger animation for a list of children.
 * Returns a ref to attach to the parent container.
 */
export function useStaggerIn<T extends HTMLElement>(
  options: UseAnimeOptions & { stagger?: number } = {},
): RefObject<T> {
  const ref = useRef<T>(null);
  const { delay = 0, duration = 500, easing = 'easeOutExpo', stagger = 80 } = options;

  useEffect(() => {
    if (!ref.current) return;
    const children = Array.from(ref.current.children) as HTMLElement[];
    children.forEach((child) => {
      child.style.opacity = '0';
      child.style.transform = 'translateY(16px)';
    });

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      const anime = (await import('animejs')).default;
      anime({
        targets: children,
        opacity: [0, 1],
        translateY: [16, 0],
        duration,
        easing,
        delay: anime.stagger(stagger),
      });
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [delay, duration, easing, stagger]);

  return ref;
}
