import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeClock } from './clock-tick.js';

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
  it('UIC-RELATIVE-TIME-2.2 shares one timer across a large batch of subscriptions', () => {
    let woken = 0;
    const at = Date.now() + 1000;
    const stops = Array.from({ length: 150_000 }, () => subscribeClock(at, () => woken++));
    try {
      expect(vi.getTimerCount()).toBe(1);
      vi.advanceTimersByTime(1000);
      expect(woken).toBe(150_000);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      stops.forEach((stop) => stop());
    }
  });

  it('UIC-RELATIVE-TIME-2.2 reschedules a subscriber moved away from the earliest moment', () => {
    const wake = vi.fn();
    const other = vi.fn();
    const start = Date.now();
    const stop = subscribeClock(start + 1000, wake);
    const stopOther = subscribeClock(start + 2000, other);
    const stopLater = subscribeClock(start + 3000, wake);
    vi.advanceTimersByTime(1000);
    expect(wake).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(other).toHaveBeenCalledOnce();
    expect(wake).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(wake).toHaveBeenCalledOnce();
    stop();
    stopOther();
    stopLater();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-RELATIVE-TIME-2.2 schedules a new subscription created by a wake callback', () => {
    const wake = vi.fn();
    const start = Date.now();
    subscribeClock(start + 1000, () => subscribeClock(start + 2000, wake));
    vi.advanceTimersByTime(1000);
    expect(wake).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(wake).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-RELATIVE-TIME-2.2 cancels another due subscriber from a wake callback', () => {
    const wake = vi.fn();
    const at = Date.now() + 1000;
    subscribeClock(at, () => stop());
    const stop = subscribeClock(at, wake);
    vi.advanceTimersByTime(1000);
    expect(wake).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-RELATIVE-TIME-2.2 cancels a large batch sharing the earliest moment', () => {
    const wake = vi.fn();
    const at = Date.now() + 1000;
    const stops = Array.from({ length: 150_000 }, () => subscribeClock(at, () => wake()));
    stops.forEach((stop) => stop());
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(wake).not.toHaveBeenCalled();
  });
  it('UIC-RELATIVE-TIME-2.2 defers another due subscriber rescheduled by a wake callback', () => {
    const wake = vi.fn();
    const at = Date.now() + 1000;
    subscribeClock(at, () => subscribeClock(at + 1000, wake));
    subscribeClock(at, wake);
    vi.advanceTimersByTime(1000);
    expect(wake).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(wake).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
