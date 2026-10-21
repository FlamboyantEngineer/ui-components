// One timer for every relative time on the page: each subscriber asks to be woken at a moment, and
// the clock keeps a single timeout for the earliest one.

import { useEffect, useReducer } from 'react';

type Wake = () => void;

const wakeTimes = new Map<Wake, number>();
let timer: ReturnType<typeof setTimeout> | undefined;
let timerAt = Infinity;

function schedule(): void {
  const next = Math.min(...wakeTimes.values());
  if (next === timerAt) return;
  clearTimeout(timer);
  timer = undefined;
  timerAt = next;
  if (next !== Infinity) timer = setTimeout(fire, Math.max(next - Date.now(), 0));
}

function fire(): void {
  timer = undefined;
  timerAt = Infinity;
  const now = Date.now();
  for (const [wake, at] of [...wakeTimes]) {
    if (at > now) continue;
    wakeTimes.delete(wake);
    wake();
  }
  schedule();
}

/** Wakes `wake` once at `at` (epoch milliseconds); the returned function cancels it. */
export function subscribeClock(at: number, wake: Wake): () => void {
  wakeTimes.set(wake, at);
  schedule();
  return () => {
    wakeTimes.delete(wake);
    schedule();
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
