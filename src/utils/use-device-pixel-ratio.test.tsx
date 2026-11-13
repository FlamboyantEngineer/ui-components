import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDevicePixelRatio } from './use-device-pixel-ratio.js';

/** A window's `matchMedia` whose resolution queries the test changes by hand. */
function stubResolutionQueries(view: Window) {
  const listeners = new Map<string, Set<() => void>>();
  const matchMedia = vi.fn((media: string) => ({
    media,
    addEventListener: (_type: string, listener: () => void) => {
      const set = listeners.get(media) ?? new Set();
      listeners.set(media, set.add(listener));
    },
    removeEventListener: (_type: string, listener: () => void) => {
      listeners.get(media)?.delete(listener);
    },
  }));
  Object.defineProperty(view, 'matchMedia', { value: matchMedia, configurable: true });
  const setRatio = (ratio: number) => {
    const previous = `(resolution: ${String(view.devicePixelRatio)}dppx)`;
    Object.defineProperty(view, 'devicePixelRatio', { value: ratio, configurable: true });
    for (const listener of [...(listeners.get(previous) ?? [])]) listener();
  };
  const count = () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0);
  return { setRatio, count };
}

describe('useDevicePixelRatio', () => {
  afterEach(() => {
    Reflect.deleteProperty(window, 'matchMedia');
    Reflect.deleteProperty(window, 'devicePixelRatio');
  });

  it('UIC-PDF-VIEWER-2.1 follows the ratio through each change and stops listening on unmount', () => {
    const queries = stubResolutionQueries(window);
    queries.setRatio(1);
    const node = document.createElement('canvas');
    document.body.append(node);
    const { result, unmount } = renderHook(() => useDevicePixelRatio(node));
    expect(result.current).toBe(1);
    act(() => queries.setRatio(2));
    expect(result.current).toBe(2);
    act(() => queries.setRatio(1.5));
    expect(result.current).toBe(1.5);
    expect(queries.count()).toBe(1);
    unmount();
    expect(queries.count()).toBe(0);
    node.remove();
  });

  it("UIC-PDF-VIEWER-2.1 reads the ratio of the node's own window, and 1 without a node", () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const view = frame.contentWindow;
    if (!view) throw new Error('The frame has no window');
    Object.defineProperty(view, 'devicePixelRatio', { value: 3, configurable: true });
    const node = view.document.createElement('canvas');
    expect(renderHook(() => useDevicePixelRatio(node)).result.current).toBe(3);
    expect(renderHook(() => useDevicePixelRatio(null)).result.current).toBe(1);
    frame.remove();
  });
});
