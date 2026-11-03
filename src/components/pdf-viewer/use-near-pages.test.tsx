import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireDefined } from '../../utils/require-defined.js';
import { useNearPages } from './use-near-pages.js';

function createObserver() {
  const instances: Array<{
    observe: ReturnType<typeof vi.fn>;
    unobserve: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    report(target: Element, isIntersecting: boolean): void;
  }> = [];
  const Observer = vi.fn(function (callback: IntersectionObserverCallback) {
    const instance = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      report(target: Element, isIntersecting: boolean) {
        callback(
          [{ target, isIntersecting } as IntersectionObserverEntry],
          instance as unknown as IntersectionObserver,
        );
      },
    };
    instances.push(instance);
    return instance;
  });
  return { Observer, instances };
}

function createScroller(Observer: unknown) {
  const frame = document.body.appendChild(document.createElement('iframe'));
  const owner = requireDefined(frame.contentDocument);
  Object.defineProperty(frame.contentWindow, 'IntersectionObserver', {
    configurable: true,
    value: Observer,
  });
  const scroller = owner.body.appendChild(owner.createElement('div'));
  Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 600 });
  return scroller;
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.querySelectorAll('iframe').forEach((frame) => frame.remove());
});

describe('useNearPages', () => {
  it('UIC-PDF-VIEWER-2.1 observes through the scroller window and keeps unchanged reports stable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { Observer, instances } = createObserver();
    const scroller = createScroller(Observer);
    const scrollerRef = { current: scroller };
    const page = scroller.ownerDocument.createElement('div');
    const renders: Array<ReadonlySet<number> | null> = [];
    const { result } = renderHook(() => {
      const pages = useNearPages(scrollerRef);
      renders.push(pages.nearPages);
      return pages;
    });
    expect(renders.length).toBeGreaterThan(0);
    expect(renders.every((pages) => pages !== null)).toBe(true);
    act(() => result.current.registerPage(0, page));
    expect(Observer).toHaveBeenCalledWith(expect.any(Function), {
      root: scroller,
      rootMargin: '600px 0px',
    });
    expect(instances[0]?.observe).toHaveBeenCalledWith(page);
    act(() => instances[0]?.report(page, true));
    const near = result.current.nearPages;
    expect(near).toEqual(new Set([0]));
    act(() => instances[0]?.report(page, true));
    expect(result.current.nearPages).toBe(near);
  });

  it('UIC-PDF-VIEWER-2.1 tracks a screen by height and ignores old reports after the scroller resizes', () => {
    const { Observer, instances } = createObserver();
    const scroller = createScroller(Observer);
    const resized = vi.fn();
    const ResizeObserver = vi.fn(function (callback: ResizeObserverCallback) {
      resized.mockImplementation(callback);
      return { observe: vi.fn(), disconnect: vi.fn() };
    });
    Object.defineProperty(scroller.ownerDocument.defaultView, 'ResizeObserver', {
      configurable: true,
      value: ResizeObserver,
    });
    const page = scroller.ownerDocument.createElement('div');
    const scrollerRef = { current: scroller };
    const { result } = renderHook(() => useNearPages(scrollerRef));
    act(() => result.current.registerPage(0, page));
    act(() => instances[0]?.report(page, true));
    const before = result.current.nearPages;
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 900 });
    act(() => {
      resized();
    });
    expect(Observer).toHaveBeenLastCalledWith(expect.any(Function), {
      root: scroller,
      rootMargin: '900px 0px',
    });
    expect(instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(instances[1]?.observe).toHaveBeenCalledWith(page);
    expect(result.current.nearPages).toBe(before);
    act(() => instances[0]?.report(page, false));
    expect(result.current.nearPages).toBe(before);
    act(() => instances[1]?.report(page, false));
    expect(result.current.nearPages).toEqual(new Set());
  });

  it('UIC-PDF-VIEWER-2.1 ignores retired page elements when their intersection arrives late', () => {
    const { Observer, instances } = createObserver();
    const scroller = createScroller(Observer);
    const scrollerRef = { current: scroller };
    const first = scroller.ownerDocument.createElement('div');
    const next = scroller.ownerDocument.createElement('div');
    const { result } = renderHook(() => useNearPages(scrollerRef));
    act(() => result.current.registerPage(0, first));
    act(() => instances[0]?.report(first, true));
    expect(result.current.nearPages).toEqual(new Set([0]));

    act(() => result.current.registerPage(0, next));
    expect(instances[0]?.unobserve).toHaveBeenCalledWith(first);
    expect(result.current.nearPages).toEqual(new Set());
    act(() => instances[0]?.report(first, true));
    expect(result.current.nearPages).toEqual(new Set());
    act(() => instances[0]?.report(next, true));
    expect(result.current.nearPages).toEqual(new Set([0]));

    act(() => result.current.registerPage(0, null));
    expect(result.current.elements.current.has(0)).toBe(false);
    act(() => instances[0]?.report(next, true));
    expect(result.current.nearPages).toEqual(new Set());
  });

  it('UIC-PDF-VIEWER-2.1 ignores disconnected observers and renders every page without owner support', () => {
    const { Observer, instances } = createObserver();
    vi.stubGlobal('IntersectionObserver', Observer);
    const scroller = createScroller(Observer);
    const fallback = createScroller(undefined);
    const page = scroller.ownerDocument.createElement('div');
    const { result, rerender } = renderHook(({ root }) => useNearPages(root), {
      initialProps: { root: { current: scroller } },
    });
    act(() => result.current.registerPage(0, page));
    act(() => instances[0]?.report(page, true));
    expect(result.current.nearPages).toEqual(new Set([0]));
    rerender({ root: { current: fallback } });
    expect(instances[0]?.disconnect).toHaveBeenCalledOnce();
    expect(result.current.nearPages).toBeNull();
    expect(Observer).toHaveBeenCalledOnce();
    act(() => instances[0]?.report(page, true));
    expect(result.current.nearPages).toBeNull();
  });
});
