import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findOverlayScrollContainer,
  getOverlayBoundary,
  type OverlayGeometry,
  resolveOverlayGeometry,
} from './overlay-geometry.js';
import { createOverlayPointRect, type OverlayRect } from './overlay-position.js';

function rect({ left, top, width, height }: Omit<OverlayRect, 'right' | 'bottom'>): OverlayRect {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

const cleanups: Array<() => void> = [];

function defineValue(target: object, property: string, value: unknown) {
  Object.defineProperty(target, property, { configurable: true, value });
  cleanups.push(() => Reflect.deleteProperty(target, property));
}

function attach<T extends HTMLElement>(element: T): T {
  document.body.append(element);
  cleanups.push(() => element.remove());
  return element;
}

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  vi.unstubAllGlobals();
});

describe('measuring', () => {
  it('UIC-OVERLAY-POSITION-3.1 measures the window and a boundary element', () => {
    vi.stubGlobal('innerWidth', 500);
    vi.stubGlobal('innerHeight', 400);
    vi.stubGlobal('scrollX', 0);
    vi.stubGlobal('scrollY', 100);
    defineValue(document.documentElement, 'scrollWidth', 500);
    defineValue(document.documentElement, 'scrollHeight', 1400);
    const page = getOverlayBoundary(null, { gutter: 8 });
    expect(page.visibleRect).toEqual(rect({ left: 8, top: 8, width: 484, height: 384 }));
    expect(page.contentRect).toEqual(rect({ left: 8, top: -92, width: 484, height: 1384 }));
    expect(page.horizontalRect).toEqual(page.visibleRect);
    expect(page).toMatchObject({ hasHorizontalScroll: false, hasVerticalScroll: true });

    const frame = attach(document.createElement('div'));
    frame.getBoundingClientRect = () => DOMRect.fromRect({ x: 20, y: 30, width: 200, height: 100 });
    defineValue(frame, 'clientWidth', 200);
    defineValue(frame, 'clientHeight', 100);
    defineValue(frame, 'scrollWidth', 600);
    defineValue(frame, 'scrollHeight', 100);
    frame.scrollLeft = 0;
    const boundary = getOverlayBoundary(frame, { gutter: 4 });
    expect(boundary.visibleRect).toEqual(rect({ left: 24, top: 34, width: 192, height: 92 }));
    expect(boundary.contentRect).toEqual(rect({ left: 24, top: 34, width: 592, height: 92 }));
    expect(boundary.horizontalRect).toEqual(boundary.contentRect);
    expect(boundary).toMatchObject({ hasHorizontalScroll: true, hasVerticalScroll: false });
  });

  it('UIC-OVERLAY-POSITION-3.2 finds the nearest scrolling ancestor, passing over skipped ones', () => {
    const host = attach(document.createElement('div'));
    const strip = document.createElement('div');
    const trigger = document.createElement('button');
    host.append(strip);
    strip.append(trigger);
    host.style.overflowY = 'auto';
    strip.style.overflowX = 'auto';
    defineValue(host, 'clientHeight', 600);
    defineValue(host, 'scrollHeight', 2000);
    defineValue(strip, 'clientWidth', 300);
    defineValue(strip, 'scrollWidth', 400);

    expect(findOverlayScrollContainer(trigger)).toBe(strip);
    expect(findOverlayScrollContainer(trigger, { skip: (element) => element === strip })).toBe(
      host,
    );
    defineValue(host, 'scrollHeight', 600);
    expect(findOverlayScrollContainer(trigger, { skip: (element) => element === strip })).toBe(
      null,
    );
    expect(findOverlayScrollContainer(null)).toBe(null);
  });

  it('UIC-OVERLAY-POSITION-3.3 keeps a wrapped width limit stable and releases it when the boundary grows', () => {
    vi.stubGlobal('innerWidth', 500);
    vi.stubGlobal('innerHeight', 400);
    for (const initialFrameWidth of [180, 180.75]) {
      const frame = attach(document.createElement('div'));
      frame.dir = 'rtl';
      const menu = attach(document.createElement('div'));
      let frameWidth = initialFrameWidth;
      let intrinsicWidth = 200;
      let cap: number | null = null;
      const measuredWidth = () => (cap === null ? intrinsicWidth : Math.min(intrinsicWidth, cap));
      frame.getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 20, y: 20, width: frameWidth, height: 200 });
      menu.getBoundingClientRect = () =>
        DOMRect.fromRect({ x: 28, y: 52, width: measuredWidth(), height: 40 });
      Object.defineProperties(menu, {
        scrollWidth: { configurable: true, get: () => Math.floor(measuredWidth()) },
        offsetWidth: { configurable: true, get: () => Math.round(measuredWidth()) },
      });
      const resolve = () =>
        resolveOverlayGeometry(menu, createOverlayPointRect(30, 50), { boundaryElement: frame });
      const apply = (geometry: OverlayGeometry) => {
        cap = geometry.maxWidth;
      };

      const initial = resolve();
      expect(initial).toMatchObject({ maxWidth: 164, constrainedWidth: true });
      apply(initial);
      for (let pass = 0; pass < 3; pass += 1) {
        const again = resolve();
        expect(again).toEqual(initial);
        apply(again);
      }
      frameWidth = 140.5;
      const narrowed = resolve();
      expect(narrowed.maxWidth).toBe(124);
      apply(narrowed);
      expect(resolve()).toEqual(narrowed);
      frameWidth = 280.5;
      const widened = resolve();
      expect(widened.maxWidth).toBeNull();
      apply(widened);
      expect(measuredWidth()).toBe(200);
      expect(resolve().maxWidth).toBeNull();
      frameWidth = initialFrameWidth;
      apply(resolve());
      intrinsicWidth = 80;
      const shorter = resolve();
      expect(shorter).toMatchObject({ maxWidth: null, constrainedWidth: false });
    }
  });

  it('UIC-OVERLAY-POSITION-3.3 constrains height and offsets absolute coordinates', () => {
    vi.stubGlobal('innerWidth', 500);
    vi.stubGlobal('innerHeight', 400);
    const panel = attach(document.createElement('div'));
    panel.getBoundingClientRect = () => DOMRect.fromRect({ width: 120.4, height: 600 });
    const anchor = attach(document.createElement('button'));
    anchor.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 40.6, y: 100, width: 80, height: 20 });

    const fixed = resolveOverlayGeometry(panel, anchor);
    expect(fixed).toEqual({
      strategy: 'fixed',
      left: 41,
      top: 126,
      maxWidth: null,
      maxHeight: 266,
      side: 'bottom',
      align: 'start',
      constrained: true,
      constrainedWidth: false,
      availableWidth: 484,
      availableHeight: 266,
      transformOrigin: '40px 0px',
    });

    const parent = attach(document.createElement('div'));
    parent.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 10, y: 20, width: 300, height: 300 });
    parent.scrollTop = 0;
    defineValue(parent, 'scrollTop', 30);
    const absolute = resolveOverlayGeometry(panel, anchor, {
      strategy: 'absolute',
      offsetParent: parent,
    });
    expect(absolute).toMatchObject({ strategy: 'absolute', left: 31, top: 136 });
    const fromData = resolveOverlayGeometry(panel, anchor, {
      strategy: 'absolute',
      offsetParent: {
        rect: rect({ left: 10, top: 20, width: 300, height: 300 }),
        scrollLeft: 5,
        scrollTop: 0,
      },
    });
    expect(fromData).toMatchObject({ left: 36, top: 106 });
  });

  it('UIC-OVERLAY-POSITION-3.3 UIC-OVERLAY-POSITION-1.6 caps a side overlay by its room and keeps the cap', () => {
    vi.stubGlobal('innerWidth', 500);
    vi.stubGlobal('innerHeight', 400);
    let width = 200;
    let height = 60;
    let cap: number | null = null;
    const shown = () => (cap === null ? width : Math.min(width, cap));
    const panel = attach(document.createElement('div'));
    panel.getBoundingClientRect = () => DOMRect.fromRect({ width: shown(), height });
    const anchor = attach(document.createElement('button'));
    anchor.getBoundingClientRect = () =>
      DOMRect.fromRect({ x: 300, y: 100, width: 80, height: 20 });
    const resolve = () => resolveOverlayGeometry(panel, anchor, { side: 'right', align: 'center' });

    expect(resolve()).toMatchObject({
      side: 'left',
      left: 94,
      top: 80,
      maxWidth: null,
      constrainedWidth: false,
      availableWidth: 286,
      transformOrigin: '200px 30px',
    });

    width = 400;
    const capped = resolve();
    expect(capped).toMatchObject({ side: 'left', left: 8, maxWidth: 286, constrainedWidth: true });
    cap = capped.maxWidth;
    expect(resolve()).toEqual(capped);

    height = 500;
    expect(resolve()).toMatchObject({ maxHeight: 384, constrained: true, top: 8 });
  });
});

describe('withdrawn geometry equality', () => {
  it('UIC-OVERLAY-POSITION-3.4 exports no geometry comparison', async () => {
    const geometry = await import('./overlay-geometry.js');
    expect('isSameOverlayGeometry' in geometry).toBe(false);
  });
});
