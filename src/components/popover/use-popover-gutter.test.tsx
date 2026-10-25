import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePopoverGutter } from './use-popover-gutter.js';

afterEach(() => vi.unstubAllGlobals());

describe('Popover gutter correction', () => {
  it('UIC-POPOVER-6.1 measures reserved root space and updates after resize', () => {
    let resize = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = () => callback([], this as unknown as ResizeObserver);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const root = document.documentElement;
    vi.spyOn(root, 'clientWidth', 'get').mockReturnValue(1440);
    const rect = vi
      .spyOn(root, 'getBoundingClientRect')
      .mockReturnValue(new DOMRect(0, 0, 1425, 1000));
    const panel = document.createElement('div');
    const { result } = renderHook(() => usePopoverGutter(panel));
    expect(result.current).toBe(15);
    rect.mockReturnValue(new DOMRect(15, 0, 1410, 1000));
    act(() => resize());
    expect(result.current).toBe(15);
    rect.mockReturnValue(new DOMRect(0, 0, 1440, 1000));
    act(() => resize());
    expect(result.current).toBe(0);
  });

  it('UIC-POPOVER-6.1 leaves another containing block in its own coordinate system', () => {
    vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(1440);
    vi.spyOn(document.documentElement, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 1425, 1000),
    );
    const panel = document.createElement('div');
    vi.spyOn(panel, 'offsetParent', 'get').mockReturnValue(document.createElement('section'));
    const { result, rerender } = renderHook(({ element }) => usePopoverGutter(element), {
      initialProps: { element: panel as HTMLElement | null },
    });
    expect(result.current).toBe(0);
    rerender({ element: null });
    expect(result.current).toBe(0);
  });
});
