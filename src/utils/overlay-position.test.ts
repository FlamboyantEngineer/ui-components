import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OVERLAY_GAP,
  DEFAULT_OVERLAY_GUTTER,
  DEFAULT_SUBMENU_OVERLAP,
  createOverlayPointRect,
  resolveOverlayPlacement,
  resolveSubmenuPlacement,
  toOverlayRect,
  type OverlayRect,
} from './overlay-position.js';

function rect({ left, top, width, height }: Omit<OverlayRect, 'right' | 'bottom'>): OverlayRect {
  return { left, top, right: left + width, bottom: top + height, width, height };
}

/** A 400 × 300 visible boundary at the origin. */
const visibleRect = rect({ left: 0, top: 0, width: 400, height: 300 });

describe('resolveOverlayPlacement', () => {
  it('UIC-OVERLAY-POSITION-1.1 opens below, flips above, and otherwise takes the roomier side', () => {
    const below = resolveOverlayPlacement({
      anchorRect: rect({ left: 20, top: 40, width: 80, height: 20 }),
      overlaySize: { width: 120, height: 100 },
      visibleRect,
    });
    expect(below).toMatchObject({ side: 'bottom', top: 66, left: 20, constrained: false });
    expect(below.top).toBe(60 + DEFAULT_OVERLAY_GAP);
    expect(below.availableAbove).toBe(34);
    expect(below.availableBelow).toBe(234);

    const above = resolveOverlayPlacement({
      anchorRect: rect({ left: 20, top: 250, width: 80, height: 20 }),
      overlaySize: { width: 120, height: 100 },
      visibleRect,
      gap: 4,
    });
    expect(above).toMatchObject({ side: 'top', top: 146, constrained: false });

    const roomier = resolveOverlayPlacement({
      anchorRect: rect({ left: 20, top: 180, width: 80, height: 20 }),
      overlaySize: { width: 120, height: 250 },
      visibleRect,
    });
    expect(roomier.side).toBe('top');
  });

  it('UIC-OVERLAY-POSITION-1.2 constrains an overlay taller than its side', () => {
    const placement = resolveOverlayPlacement({
      anchorRect: rect({ left: 20, top: 100, width: 80, height: 20 }),
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
      anchorRect: rect({ left: 20, top: 100, width: 80, height: 20 }),
      overlaySize: { width: 120, height: 50 },
      visibleRect,
    });
    expect(fits.maxHeight).toBe(50);
  });

  it('UIC-OVERLAY-POSITION-1.3 lines up with the preferred edge, flips, clamps and follows rtl', () => {
    const base = { overlaySize: { width: 150, height: 40 }, visibleRect };
    expect(
      resolveOverlayPlacement({
        ...base,
        anchorRect: rect({ left: 20, top: 10, width: 60, height: 20 }),
      }),
    ).toMatchObject({
      align: 'start',
      left: 20,
    });
    expect(
      resolveOverlayPlacement({
        ...base,
        anchorRect: rect({ left: 300, top: 10, width: 60, height: 20 }),
      }),
    ).toMatchObject({
      align: 'end',
      left: 210,
    });
    expect(
      resolveOverlayPlacement({
        ...base,
        anchorRect: rect({ left: 200, top: 10, width: 60, height: 20 }),
        align: 'end',
      }),
    ).toMatchObject({ align: 'end', left: 110 });
    expect(
      resolveOverlayPlacement({
        ...base,
        anchorRect: rect({ left: 20, top: 10, width: 60, height: 20 }),
        align: 'end',
      }),
    ).toMatchObject({ align: 'start', left: 20 });
    expect(
      resolveOverlayPlacement({
        ...base,
        overlaySize: { width: 380, height: 40 },
        anchorRect: rect({ left: 100, top: 10, width: 60, height: 20 }),
      }),
    ).toMatchObject({ left: 20 });

    const rtl = { ...base, dir: 'rtl' as const };
    expect(
      resolveOverlayPlacement({
        ...rtl,
        anchorRect: rect({ left: 200, top: 10, width: 60, height: 20 }),
      }),
    ).toMatchObject({
      align: 'start',
      left: 110,
    });
    expect(
      resolveOverlayPlacement({
        ...rtl,
        anchorRect: rect({ left: 20, top: 10, width: 60, height: 20 }),
      }),
    ).toMatchObject({
      align: 'end',
      left: 20,
    });
  });

  it('UIC-OVERLAY-POSITION-1.4 clamps in viewport mode and uses the scrollable content in content mode', () => {
    const contentRect = rect({ left: 0, top: -500, width: 400, height: 2000 });
    const anchorRect = rect({ left: 20, top: 250, width: 80, height: 20 });
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
      anchorRect: rect({ left: 20, top: -40, width: 80, height: 20 }),
      overlaySize: { width: 120, height: 100 },
      visibleRect,
    });
    expect(clamped.top).toBe(0);
  });

  it('UIC-OVERLAY-POSITION-1.5 solves point anchors as zero-size rects', () => {
    expect(createOverlayPointRect(30, 50)).toEqual(
      rect({ left: 30, top: 50, width: 0, height: 0 }),
    );
    expect(
      resolveOverlayPlacement({
        anchorRect: createOverlayPointRect(30, 50),
        overlaySize: { width: 100, height: 60 },
        visibleRect,
        gap: 2,
      }),
    ).toMatchObject({ side: 'bottom', left: 30, top: 52 });
    expect(toOverlayRect({ left: 1, top: 2, right: 11, bottom: 7 })).toEqual(
      rect({ left: 1, top: 2, width: 10, height: 5 }),
    );
  });
});

describe('resolveSubmenuPlacement', () => {
  const overlaySize = { width: 120, height: 100 };

  it('UIC-OVERLAY-POSITION-2.1 opens on the reading side when it fits or has more room', () => {
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 40, top: 20, width: 100, height: 24 }),
        overlaySize,
        visibleRect,
      }),
    ).toMatchObject({ side: 'right', left: 140 - DEFAULT_SUBMENU_OVERLAP });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 250, top: 20, width: 100, height: 24 }),
        overlaySize,
        visibleRect,
      }),
    ).toMatchObject({ side: 'left', left: 136 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 40, top: 20, width: 100, height: 24 }),
        overlaySize: { width: 320, height: 100 },
        visibleRect,
        overlap: 0,
      }),
    ).toMatchObject({ side: 'right', left: 80 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 250, top: 20, width: 100, height: 24 }),
        overlaySize,
        visibleRect,
        dir: 'rtl',
      }),
    ).toMatchObject({ side: 'left', left: 136 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 40, top: 20, width: 100, height: 24 }),
        overlaySize,
        visibleRect,
        dir: 'rtl',
      }),
    ).toMatchObject({ side: 'right' });
  });

  it('UIC-OVERLAY-POSITION-2.2 extends down, up, or toward the roomier side, constrained', () => {
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 40, top: 20, width: 100, height: 24 }),
        overlaySize,
        visibleRect,
      }),
    ).toMatchObject({ direction: 'down', top: 20, constrained: false, maxHeight: 100 });
    expect(
      resolveSubmenuPlacement({
        triggerRect: rect({ left: 40, top: 250, width: 100, height: 24 }),
        overlaySize,
        visibleRect,
      }),
    ).toMatchObject({ direction: 'up', top: 174 });
    const tall = resolveSubmenuPlacement({
      triggerRect: rect({ left: 40, top: 100, width: 100, height: 24 }),
      overlaySize: { width: 120, height: 400 },
      visibleRect,
    });
    expect(tall).toMatchObject({ direction: 'down', constrained: true, maxHeight: 192, top: 100 });
    expect(tall.maxHeight).toBe(200 - DEFAULT_OVERLAY_GUTTER);
    const content = resolveSubmenuPlacement({
      triggerRect: rect({ left: 40, top: 250, width: 100, height: 24 }),
      overlaySize,
      visibleRect,
      contentRect: rect({ left: 0, top: 0, width: 400, height: 1000 }),
      mode: 'content',
    });
    expect(content).toMatchObject({ direction: 'down', top: 250 });
  });
});
