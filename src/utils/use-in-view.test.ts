import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useInView } from './use-in-view.js';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly elements = new Set<Element>();
  disconnected = false;
  constructor(
    readonly callback: IntersectionObserverCallback,
    readonly init?: IntersectionObserverInit,
  ) {
    FakeIntersectionObserver.instances.push(this);
  }
  observe(element: Element): void {
    this.elements.add(element);
  }
  unobserve(element: Element): void {
    this.elements.delete(element);
  }
  disconnect(): void {
    this.disconnected = true;
    this.elements.clear();
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  report(target: Element, isIntersecting: boolean): void {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function latestObserver(): FakeIntersectionObserver {
  const observer = FakeIntersectionObserver.instances.at(-1);
  if (!observer) throw new Error('no observer');
  return observer;
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useInView', () => {
  it('UIC-MEASUREMENT-4.1 reports whether the element intersects the viewport', () => {
    const element = document.body.appendChild(document.createElement('div'));
    const other = document.createElement('div');
    const { result, unmount } = renderHook(() => useInView(element));
    expect(result.current).toBe(false);
    const observer = latestObserver();
    expect([...observer.elements]).toEqual([element]);
    act(() => observer.report(element, true));
    expect(result.current).toBe(true);
    act(() => observer.report(other, false));
    expect(result.current).toBe(true);
    act(() => observer.report(element, false));
    expect(result.current).toBe(false);
    unmount();
    expect(observer.disconnected).toBe(true);
    element.remove();
  });

  it('UIC-MEASUREMENT-4.2 observes a ref element and stops while disabled', () => {
    const element = document.body.appendChild(document.createElement('div'));
    const ref = { current: element };
    const { result, rerender } = renderHook(({ enabled }) => useInView(ref, { enabled }), {
      initialProps: { enabled: true },
    });
    const first = latestObserver();
    act(() => first.report(element, true));
    expect(result.current).toBe(true);
    rerender({ enabled: false });
    expect(result.current).toBe(false);
    expect(first.disconnected).toBe(true);
    rerender({ enabled: true });
    expect(result.current).toBe(false);
    expect(latestObserver()).not.toBe(first);
    element.remove();
  });

  it('UIC-MEASUREMENT-4.2 follows a stable ref to an element that replaces the last', () => {
    const ref: { current: Element | null } = { current: null };
    const { result, rerender } = renderHook(() => useInView(ref));
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    const first = document.body.appendChild(document.createElement('div'));
    ref.current = first;
    rerender();
    act(() => latestObserver().report(first, true));
    expect(result.current).toBe(true);
    const old = latestObserver();
    const second = document.body.appendChild(document.createElement('div'));
    ref.current = second;
    rerender();
    expect(old.disconnected).toBe(true);
    expect(result.current).toBe(false);
    act(() => latestObserver().report(second, true));
    expect(result.current).toBe(true);
    first.remove();
    second.remove();
  });

  it('UIC-MEASUREMENT-4.1 UIC-MEASUREMENT-4.2 ignores released observations after target or enabled changes', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    const { result, rerender } = renderHook(
      ({ target, enabled }) => useInView(target, { enabled }),
      { initialProps: { target: first, enabled: true } },
    );
    const old = latestObserver();
    act(() => old.report(first, true));
    expect(result.current).toBe(true);
    rerender({ target: second, enabled: true });
    const current = latestObserver();
    act(() => old.report(first, true));
    expect(result.current).toBe(false);
    act(() => current.report(second, true));
    act(() => old.report(first, false));
    expect(result.current).toBe(true);
    rerender({ target: second, enabled: false });
    act(() => current.report(second, true));
    rerender({ target: second, enabled: true });
    act(() => current.report(second, true));
    expect(result.current).toBe(false);
    act(() => latestObserver().report(second, true));
    expect(result.current).toBe(true);
  });

  it('UIC-MEASUREMENT-4.2 returns false without an element or IntersectionObserver', () => {
    const { result } = renderHook(() => useInView(null));
    expect(result.current).toBe(false);
    vi.stubGlobal('IntersectionObserver', undefined);
    const element = document.createElement('div');
    const { result: unsupported } = renderHook(() => useInView(element));
    expect(unsupported.current).toBe(false);
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it('UIC-MEASUREMENT-4.3 extends the scrolling container view by the scroll offset', () => {
    const scroller = document.body.appendChild(document.createElement('div'));
    scroller.style.overflowY = 'auto';
    Object.defineProperty(scroller, 'scrollHeight', { configurable: true, value: 400 });
    Object.defineProperty(scroller, 'clientHeight', { configurable: true, value: 100 });
    const element = scroller.appendChild(document.createElement('div'));
    const { result, rerender } = renderHook(
      ({ scrollOffset }: { scrollOffset?: number }) => useInView(element, { scrollOffset }),
      { initialProps: {} },
    );
    expect(latestObserver().init).toBeUndefined();

    rerender({ scrollOffset: 1.5 });
    const observer = latestObserver();
    expect(observer.init).toEqual({ root: scroller, rootMargin: '0px 150% 150% 150%' });
    act(() => observer.report(element, true));
    expect(result.current).toBe(true);

    scroller.remove();
    document.body.appendChild(element);
    rerender({ scrollOffset: -1 });
    expect(latestObserver().init).toEqual({ root: null, rootMargin: '0px 0% 0% 0%' });
    element.remove();
  });
});
