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

function createDeferredClipboard() {
  const writes: { resolve: () => void; reject: (error: Error) => void }[] = [];
  const clipboard: ClipboardWriter = {
    writeText: () => new Promise<void>((resolve, reject) => writes.push({ resolve, reject })),
  };
  return { clipboard, writes };
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

  it('UIC-CLIPBOARD-2.1 keeps the latest requested result when writes settle out of order', async () => {
    const { clipboard, writes } = createDeferredClipboard();
    const { result } = renderHook(() => useClipboard({ clipboard, fallback: false }));
    const earlier = result.current.copy('Earlier');
    const latest = result.current.copy('Latest');
    await act(async () => {
      writes[1]?.resolve();
      expect(await latest).toBe(true);
    });
    expect(result.current.status).toBe('copied');
    act(() => vi.advanceTimersByTime(DEFAULT_COPY_TIMEOUT - 1));
    await act(async () => {
      writes[0]?.reject(new Error('Denied'));
      expect(await earlier).toBe(false);
    });
    expect(result.current.status).toBe('copied');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.status).toBe('idle');
  });

  it('UIC-CLIPBOARD-2.1 ignores a pending write after feedback is reset', async () => {
    const { clipboard, writes } = createDeferredClipboard();
    const { result } = renderHook(() => useClipboard({ clipboard }));
    const copy = result.current.copy('Pending');
    act(() => result.current.reset());
    await act(async () => {
      writes[0]?.resolve();
      expect(await copy).toBe(true);
    });
    expect(result.current.status).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('UIC-CLIPBOARD-2.2 ignores a write that settles after unmounting', async () => {
    const { clipboard, writes } = createDeferredClipboard();
    const { result, unmount } = renderHook(() => useClipboard({ clipboard }));
    const copy = result.current.copy('Pending');
    unmount();
    writes[0]?.resolve();
    expect(await copy).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
