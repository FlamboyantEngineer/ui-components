import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { mapScrollOffset, useSyncedScroll, type ScrollAnchor } from './use-synced-scroll.js';

function createContainer(scrollHeight: number, clientHeight = 100): HTMLElement {
  const element = document.createElement('div');
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight });
  document.body.append(element);
  return element;
}

function scrollTo(element: HTMLElement, top: number) {
  element.scrollTop = top;
  element.dispatchEvent(new Event('scroll'));
}

const anchors = (offsets: number[]): ScrollAnchor[] =>
  offsets.map((offset, index) => ({ key: index, offset }));

afterEach(() => {
  document.body.replaceChildren();
});

describe('mapScrollOffset', () => {
  it('UIC-SYNCED-SCROLL-1.2 moves in proportion between matched anchors', () => {
    const from = anchors([0, 20, 40, 60]);
    const to = anchors([0, 20, 140, 160]);
    expect(mapScrollOffset(10, from, to)).toBe(10);
    expect(mapScrollOffset(30, from, to)).toBe(80);
    expect(mapScrollOffset(40, from, to)).toBe(140);
    expect(mapScrollOffset(90, from, to)).toBe(190);
  });

  it('UIC-SYNCED-SCROLL-1.2 keeps the distance before the first anchor and skips unmatched ones', () => {
    const from = [
      { key: 'a', offset: 50 },
      { key: 'gone', offset: 70 },
      { key: 'b', offset: 100 },
    ];
    const to = [
      { key: 'a', offset: 80 },
      { key: 'b', offset: 180 },
    ];
    expect(mapScrollOffset(30, from, to)).toBe(60);
    expect(mapScrollOffset(75, from, to)).toBe(130);
    expect(mapScrollOffset(42, [], to)).toBe(42);
    expect(mapScrollOffset(42, from, [{ key: 'other', offset: 0 }])).toBe(42);
  });
});

describe('useSyncedScroll', () => {
  it('UIC-SYNCED-SCROLL-1.1 aligns the same fraction of each scroll range', () => {
    const first = createContainer(300);
    const second = createContainer(500);
    renderHook(() => useSyncedScroll([first, { current: second }]));
    scrollTo(first, 100);
    expect(second.scrollTop).toBe(200);
    scrollTo(second, 400);
    expect(first.scrollTop).toBe(200);
  });

  it('UIC-SYNCED-SCROLL-1.2 aligns matched anchors and clamps to the scroll range', () => {
    const first = createContainer(300);
    const second = createContainer(250);
    const offsets = new Map([
      [first, anchors([0, 100, 200])],
      [second, anchors([0, 50, 150])],
    ]);
    renderHook(() =>
      useSyncedScroll([first, second], {
        getAnchors: (container) => offsets.get(container) ?? [],
      }),
    );
    scrollTo(first, 150);
    expect(second.scrollTop).toBe(100);
    scrollTo(first, 200);
    expect(second.scrollTop).toBe(150);
  });

  it('UIC-SYNCED-SCROLL-1.3 ignores the scroll events of positions it set', () => {
    const first = createContainer(300);
    const second = createContainer(500);
    renderHook(() => useSyncedScroll([first, second]));
    scrollTo(first, 100);
    expect(second.scrollTop).toBe(200);
    first.scrollTop = 150;
    second.dispatchEvent(new Event('scroll'));
    expect(first.scrollTop).toBe(150);
  });

  it('UIC-SYNCED-SCROLL-1.3 stops when disabled, when a target is missing and on unmount', () => {
    const first = createContainer(300);
    const second = createContainer(500);
    const { rerender, unmount } = renderHook(
      ({ enabled, other }: { enabled: boolean; other: HTMLElement | null }) =>
        useSyncedScroll([first, other], { enabled }),
      { initialProps: { enabled: false, other: second as HTMLElement | null } },
    );
    scrollTo(first, 100);
    expect(second.scrollTop).toBe(0);
    rerender({ enabled: true, other: null });
    scrollTo(first, 50);
    expect(second.scrollTop).toBe(0);
    rerender({ enabled: true, other: second });
    scrollTo(first, 100);
    expect(second.scrollTop).toBe(200);
    unmount();
    scrollTo(first, 0);
    expect(second.scrollTop).toBe(200);
  });
});
