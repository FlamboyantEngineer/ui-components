import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClipboardWriter } from './clipboard.js';
import { DEFAULT_COPY_TIMEOUT, useClipboard } from './use-clipboard.js';

function createClipboard(fails = false) {
  const written: string[] = [];
  const clipboard: ClipboardWriter = {
    writeText: async (text) => {
      if (fails) throw new Error('Denied');
      written.push(text);
    },
  };
  return { clipboard, written };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useClipboard', () => {
  it('UIC-CLIPBOARD-2.1 reports a copy for the timeout, then returns to idle', async () => {
    const { clipboard, written } = createClipboard();
    const { result } = renderHook(() => useClipboard({ clipboard }));
    expect(result.current.status).toBe('idle');

    let copied = false;
    await act(async () => {
      copied = await result.current.copy('Report.pdf');
    });
    expect(copied).toBe(true);
    expect(written).toEqual(['Report.pdf']);
    expect(result.current.status).toBe('copied');

    act(() => vi.advanceTimersByTime(DEFAULT_COPY_TIMEOUT - 1));
    expect(result.current.status).toBe('copied');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe('idle');
  });

  it('UIC-CLIPBOARD-2.1 restarts the timeout on a new copy and resets on request', async () => {
    const { clipboard } = createClipboard();
    const { result } = renderHook(() => useClipboard({ clipboard, timeout: 500 }));
    await act(async () => {
      await result.current.copy('Lisbon');
    });
    act(() => vi.advanceTimersByTime(400));
    await act(async () => {
      await result.current.copy('Porto');
    });
    act(() => vi.advanceTimersByTime(400));
    expect(result.current.status).toBe('copied');
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.status).toBe('idle');
  });

  it('UIC-CLIPBOARD-2.2 reports a refused copy as failed and clears its timer on unmount', async () => {
    const { clipboard } = createClipboard(true);
    const { result, unmount } = renderHook(() => useClipboard({ clipboard, fallback: false }));
    let copied = true;
    await act(async () => {
      copied = await result.current.copy('Secret');
    });
    expect(copied).toBe(false);
    expect(result.current.status).toBe('failed');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
