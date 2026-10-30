'use client';

// One timer for every relative time on the page: each subscriber asks to be woken at a moment, and
// the clock keeps a single timeout for the earliest one.

import { useEffect, useReducer } from 'react';
import { requireDefined } from '../../utils/require-defined.js';

type Wake = () => void;

const wakeTimes = new Map<Wake, number>();
const wakeCounts = new Map<number, number>();
let timer: ReturnType<typeof setTimeout> | undefined;
let timerAt = Infinity;

function findNextWake(): number {
  let next = Infinity;
  for (const at of wakeCounts.keys()) next = Math.min(next, at);
  return next;
}

function schedule(next = findNextWake()): void {
  if (next === timerAt) return;
  clearTimeout(timer);
  timer = undefined;
  timerAt = next;
  if (next !== Infinity) timer = setTimeout(fire, Math.max(next - Date.now(), 0));
}

function removeWake(wake: Wake): number | undefined {
  const at = wakeTimes.get(wake);
  if (at === undefined) return undefined;
  wakeTimes.delete(wake);
  const count = requireDefined(wakeCounts.get(at));
  if (count === 1) wakeCounts.delete(at);
  else wakeCounts.set(at, count - 1);
  return at;
}

function fire(): void {
  timer = undefined;
  timerAt = Infinity;
  const now = Date.now();
  for (const [wake, at] of [...wakeTimes]) {
    if (at > now || wakeTimes.get(wake) !== at) continue;
    removeWake(wake);
    wake();
  }
  schedule();
}

/** Wakes `wake` once at `at` (epoch milliseconds); the returned function cancels it. */
export function subscribeClock(at: number, wake: Wake): () => void {
  const previous = removeWake(wake);
  wakeTimes.set(wake, at);
  wakeCounts.set(at, (wakeCounts.get(at) ?? 0) + 1);
  if (at < timerAt) schedule(at);
  else if (previous === timerAt && !wakeCounts.has(timerAt)) schedule();
  return () => {
    const cancelled = removeWake(wake);
    if (cancelled === timerAt && !wakeCounts.has(timerAt)) schedule();
  };
}

/** Renders the calling component again `delay` milliseconds from now, on the shared clock. */
export function useClockTick(delay: number | null): void {
  const [tick, wake] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (delay === null) return undefined;
    return subscribeClock(Date.now() + delay, wake);
  }, [delay, tick]);
}
