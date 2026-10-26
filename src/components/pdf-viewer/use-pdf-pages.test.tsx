import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { usePdfPages } from './use-pdf-pages.js';

function createScroller() {
  const frame = document.body.appendChild(document.createElement('iframe'));
  const owner = requireDefined(frame.contentDocument);
  const view = requireDefined(frame.contentWindow);
  const scroller = owner.body.appendChild(owner.createElement('div'));
  scroller.getBoundingClientRect = () => DOMRect.fromRect({ width: 100, height: 100 });
  Object.defineProperties(scroller, {
    clientWidth: { value: 100 },
    scrollWidth: { configurable: true, value: 200 },
  });
  const callbacks: FrameRequestCallback[] = [];
  const request = vi.fn((callback: FrameRequestCallback) => callbacks.push(callback) - 1);
  const cancel = vi.fn();
  Object.defineProperties(view, {
    requestAnimationFrame: { configurable: true, value: request },
    cancelAnimationFrame: { configurable: true, value: cancel },
    IntersectionObserver: { configurable: true, value: undefined },
  });
  const page = owner.createElement('div');
  let height = 200;
  const measure = vi.fn(() => DOMRect.fromRect({ y: -scroller.scrollTop, width: 100, height }));
  page.getBoundingClientRect = measure;
  return { scroller, page, callbacks, request, cancel, measure, resize: () => (height = 400) };
}

afterEach(() => document.querySelectorAll('iframe').forEach((frame) => frame.remove()));

describe('usePdfPages', () => {
  it('UIC-PDF-VIEWER-3.3 records one scroll per owning-window frame, including frame zero', () => {
    const host = createScroller();
    const scrollerRef = { current: host.scroller };
    const loaded = {};
    const { result } = renderHook(() =>
      usePdfPages({ scrollerRef, document: loaded, pageCount: 2 }),
    );
    act(() => result.current.registerPage(1, host.page));
    host.scroller.scrollTop = 50;
    act(() => {
      result.current.handleScroll();
      result.current.handleScroll();
    });
    expect(host.request).toHaveBeenCalledTimes(1);
    act(() => host.callbacks[0]?.(0));
    expect(result.current.currentPage).toBe(1);

    host.resize();
    Object.defineProperty(host.scroller, 'scrollWidth', { value: 400 });
    act(() => result.current.restoreAnchor());
    expect(host.scroller.scrollTop).toBe(100);
    expect(host.scroller.scrollLeft).toBe(50);
  });

  it('UIC-PDF-VIEWER-2.3 cancels frame zero on unmount and ignores a late callback', () => {
    const host = createScroller();
    const scrollerRef = { current: host.scroller };
    const loaded = {};
    const { result, unmount } = renderHook(() =>
      usePdfPages({ scrollerRef, document: loaded, pageCount: 2 }),
    );
    act(() => result.current.registerPage(1, host.page));
    act(() => result.current.handleScroll());
    unmount();
    expect(host.cancel).toHaveBeenCalledWith(0);
    act(() => host.callbacks[0]?.(0));
    expect(host.measure).not.toHaveBeenCalled();
  });

  it('UIC-PDF-VIEWER-2.3 discards a queued scroll when a new document opens', () => {
    const host = createScroller();
    const scrollerRef = { current: host.scroller };
    const { result, rerender } = renderHook(
      ({ loaded }) => usePdfPages({ scrollerRef, document: loaded, pageCount: 2 }),
      { initialProps: { loaded: {} } },
    );
    act(() => result.current.registerPage(1, host.page));
    host.scroller.scrollTop = 50;
    act(() => result.current.handleScroll());
    rerender({ loaded: {} });
    expect(host.cancel).toHaveBeenCalledWith(0);
    expect(host.scroller.scrollTop).toBe(0);
    act(() => host.callbacks[0]?.(0));
    expect(host.measure).not.toHaveBeenCalled();
    expect(result.current.currentPage).toBe(0);

    act(() => result.current.handleScroll());
    expect(host.request).toHaveBeenCalledTimes(2);
    act(() => host.callbacks[1]?.(0));
    expect(result.current.currentPage).toBe(1);
  });
});
