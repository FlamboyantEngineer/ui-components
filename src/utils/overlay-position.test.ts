import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findOverlayScrollContainer,
  getOverlayBoundary,
  isSameOverlayGeometry,
  overlayPointRect,
  resolveOverlayGeometry,
  resolveOverlayPlacement,
  resolveSubmenuPlacement,
  toOverlayRect,
  type OverlayGeometry,
  type OverlayRect,
} from './overlay-position.js';

function rect(left: number, top: number, width: number, height: number): OverlayRect {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

/** A 400 × 300 visible boundary at the origin. */
const visibleRect = rect(0, 0, 400, 300);

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

describe('resolveOverlayPlacement', () => {
  it('UIC-OVERLAY-POSITION-1.1 opens below, flips above, and otherwise takes the roomier side', () => {
    const below = resolveOverlayPlacement({
      anchorRect: rect(20, 40, 80, 20),
      overlaySize: { width: 120, height: 100 },
      visibleRect,
    });
    expect(below).toMatchObject({ side: 'bottom', top: 66, left: 20, constrained: false });
    expect(below.availableAbove).toBe(34);
    expect(below.availableBelow).toBe(234);

    const above = resolveOverlayPlacement({
      anchorRect: rect(20, 250, 80, 20),
      overlaySize: { width: 120, height: 100 },
      visibleRect,
      gap: 4,
    });
    expect(above).toMatchObject({ side: 'top', top: 146, constrained: false });

    const roomier = resolveOverlayPlacement({
      anchorRect: rect(20, 180, 80, 20),
      overlaySize: { width: 120, height: 250 },
      visibleRect,
    });
    expect(roomier.side).toBe('top');
  });

  it('UIC-OVERLAY-POSITION-1.2 constrains an overlay taller than its side', () => {
    const placement = resolveOverlayPlacement({
      anchorRect: rect(20, 100, 80, 20),
      overlaySize: { width: 120, height: 400 },
      visibleRect,
    });
    expect(placement).toMatchObject({
      side: 'bottom',
      constrained: true,
      maxHeight: 174,
      top: 126,
    });
    const fits = resolveOverlayPlacement({
      anchorRect: rect(20, 100, 80, 20),
      overlaySize: { width: 120, height: 50 },
      visibleRect,
    });
    expect(fits.maxHeight).toBe(50);
  });

  it('UIC-OVERLAY-POSITION-1.3 lines up with the preferred edge, flips, clamps and follows rtl', () => {
    const base = { overlaySize: { width: 150, height: 40 }, visibleRect };
    expect(resolveOverlayPlacement({ ...base, anchorRect: rect(20, 10, 60, 20) })).toMatchObject({
      align: 'start',
      left: 20,
    });
    expect(resolveOverlayPlacement({ ...base, anchorRect: rect(300, 10, 60, 20) })).toMatchObject({
      align: 'end',
      left: 210,
    });
    expect(
      resolveOverlayPlacement({ ...base, anchorRect: rect(200, 10, 60, 20), align: 'end' }),
    ).toMatchObject({ align: 'end', left: 110 });
    expect(
      resolveOverlayPlacement({ ...base, anchorRect: rect(20, 10, 60, 20), align: 'end' }),
    ).toMatchObject({ align: 'start', left: 20 });
    expect(
      resolveOverlayPlacement({
        ...base,
        overlaySize: { width: 380, height: 40 },
        anchorRect: rect(100, 10, 60, 20),
      }),
    ).toMatchObject({ left: 20 });

    const rtl = { ...base, dir: 'rtl' as const };
    expect(resolveOverlayPlacement({ ...rtl, anchorRect: rect(200, 10, 60, 20) })).toMatchObject({
      align: 'start',
      left: 110,
    });
    expect(resolveOverlayPlacement({ ...rtl, anchorRect: rect(20, 10, 60, 20) })).toMatchObject({
      align: 'end',
      left: 20,
    });
  });

  it('UIC-OVERLAY-POSITION-1.4 clamps in viewport mode and uses the scrollable content in content mode', () => {
    const contentRect = rect(0, -500, 400, 2000);
    const anchorRect = rect(20, 250, 80, 20);
    const overlaySize = { width: 120, height: 200 };
    const viewport = resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, contentRect });
    expect(viewport).toMatchObject({ side: 'top', top: 44 });
    const content = resolveOverlayPlacement({
      anchorRect,
      overlaySize,
      visibleRect,
      contentRect,
      mode: 'content',
    });
    expect(content).toMatchObject({ side: 'bottom', top: 276, constrained: false });

    const clamped = resolveOverlayPlacement({
      anchorRect: rect(20, -40, 80, 20),
      overlaySize: { width: 120, height: 100 },
      visibleRect,
    });
    expect(clamped.top).toBe(0);
  });

  it('UIC-OVERLAY-POSITION-1.5 solves point anchors as zero-size rects', () => {
    expect(overlayPointRect(30, 50)).toEqual(rect(30, 50, 0, 0));
    expect(
      resolveOverlayPlacement({
        anchorRect: overlayPointRect(30, 50),
        overlaySize: { width: 100, height: 60 },
        visibleRect,
        gap: 2,
      }),
    ).toMatchObject({ side: 'bottom', left: 30, top: 52 });
    expect(toOverlayRect({ left: 1, top: 2, right: 11, bottom: 7 })).toEqual(rect(1, 2, 10, 5));
  });
});

describe('resolveSubmenuPlacement', () => {
  const overlaySize = { width: 120, height: 100 };

  it('UIC-OVERLAY-POSITION-2.1 opens on the reading side when it fits or has more room', () => {
    expect(
      resolveSubmenuPlacement({ triggerRect: rect(40, 20, 100, 24), overlaySize, visibleRect }),
    ).toMatchObject({ side: 'right', left: 134 });
    expect(
      resolveSubmenuPlacement({ triggerRect: rect(250, 20, 100, 24), overlaySize, visibleRect }),
    ).toMatchObject({ side: 'left', left: 136 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect(40, 20, 100, 24),
        overlaySize: { width: 320, height: 100 },
        visibleRect,
        overlap: 0,
      }),
    ).toMatchObject({ side: 'right', left: 80 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect(250, 20, 100, 24),
        overlaySize,
        visibleRect,
        dir: 'rtl',
      }),
    ).toMatchObject({ side: 'left', left: 136 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect(40, 20, 100, 24),
        overlaySize,
        visibleRect,
        dir: 'rtl',
      }),
    ).toMatchObject({ side: 'right' });
  });

  it('UIC-OVERLAY-POSITION-2.2 extends down, up, or toward the roomier side, constrained', () => {
    expect(
      resolveSubmenuPlacement({ triggerRect: rect(40, 20, 100, 24), overlaySize, visibleRect }),
    ).toMatchObject({ direction: 'down', top: 20, constrained: false, maxHeight: 100 });
    expect(
      resolveSubmenuPlacement({ triggerRect: rect(40, 250, 100, 24), overlaySize, visibleRect }),
    ).toMatchObject({ direction: 'up', top: 174 });
    const tall = resolveSubmenuPlacement({
      triggerRect: rect(40, 100, 100, 24),
      overlaySize: { width: 120, height: 400 },
      visibleRect,
    });
    expect(tall).toMatchObject({ direction: 'down', constrained: true, maxHeight: 192, top: 100 });
    const content = resolveSubmenuPlacement({
      triggerRect: rect(40, 250, 100, 24),
      overlaySize,
      visibleRect,
      contentRect: rect(0, 0, 400, 1000),
      mode: 'content',
    });
    expect(content).toMatchObject({ direction: 'down', top: 250 });
  });
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
    expect(page.visibleRect).toEqual(rect(8, 8, 484, 384));
    expect(page.contentRect).toEqual(rect(8, -92, 484, 1384));
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
    expect(boundary.visibleRect).toEqual(rect(24, 34, 192, 92));
    expect(boundary.contentRect).toEqual(rect(24, 34, 592, 92));
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
        resolveOverlayGeometry(menu, overlayPointRect(30, 50), { boundaryElement: frame });
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
      offsetParent: { rect: rect(10, 20, 300, 300), scrollLeft: 5, scrollTop: 0 },
    });
    expect(fromData).toMatchObject({ left: 36, top: 106 });
  });

  it('UIC-OVERLAY-POSITION-3.4 compares geometries', () => {
    const geometry: OverlayGeometry = {
      strategy: 'fixed',
      left: 1,
      top: 2,
      maxWidth: null,
      maxHeight: 40,
      side: 'bottom',
      align: 'start',
      constrained: true,
      constrainedWidth: false,
    };
    expect(isSameOverlayGeometry(geometry, { ...geometry })).toBe(true);
    expect(isSameOverlayGeometry(geometry, { ...geometry, top: 3 })).toBe(false);
    expect(isSameOverlayGeometry(geometry, { ...geometry, align: 'end' })).toBe(false);
    expect(isSameOverlayGeometry(null, null)).toBe(true);
    expect(isSameOverlayGeometry(geometry, null)).toBe(false);
  });
});
