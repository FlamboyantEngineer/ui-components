import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeClock } from './relative-time-clock.js';

describe('relative time clock', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 4, 23, 10, 30) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('UIC-RELATIVE-TIME-2.2 wakes each subscriber at its moment from one shared timer', () => {
    const woken: string[] = [];
    const start = Date.now();
    const stopSoon = subscribeClock(start + 1000, () => woken.push('soon'));
    subscribeClock(start + 5000, () => woken.push('later'));
    subscribeClock(start + 1000, () => woken.push('also soon'));
    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(999);
    expect(woken).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(woken).toEqual(['soon', 'also soon']);
    expect(vi.getTimerCount()).toBe(1);

    stopSoon();
    vi.advanceTimersByTime(4000);
    expect(woken).toEqual(['soon', 'also soon', 'later']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-RELATIVE-TIME-2.2 stops the timer when the last subscriber leaves', () => {
    const wake = vi.fn();
    const wakeEarlier = vi.fn();
    const stop = subscribeClock(Date.now() + 60_000, wake);
    const stopEarlier = subscribeClock(Date.now() + 1000, wakeEarlier);
    stopEarlier();
    expect(vi.getTimerCount()).toBe(1);
    stop();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(120_000);
    expect(wake).not.toHaveBeenCalled();
    expect(wakeEarlier).not.toHaveBeenCalled();
  });
});
