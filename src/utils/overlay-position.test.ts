import { describe, expect, it } from 'vitest';
import { DEFAULT_OVERLAY_GAP } from './overlay-defaults.js';
import {
  createOverlayPointRect,
  resolveOverlayPlacement,
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

describe('sides, alignment and outputs', () => {
  const anchorRect = rect({ left: 150, top: 120, width: 60, height: 20 });
  const overlaySize = { width: 100, height: 80 };

  it('UIC-OVERLAY-POSITION-1.6 opens on a preferred side and flips to the opposite one', () => {
    expect(
      resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, side: 'top' }),
    ).toMatchObject({ side: 'top', top: 34, left: 150 });
    expect(
      resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, side: 'right' }),
    ).toMatchObject({ side: 'right', left: 216, top: 120, constrained: false, maxWidth: 100 });
    expect(
      resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, side: 'left', gap: 4 }),
    ).toMatchObject({ side: 'left', left: 46, top: 120 });
    const nearRight = rect({ left: 330, top: 120, width: 60, height: 20 });
    expect(
      resolveOverlayPlacement({ anchorRect: nearRight, overlaySize, visibleRect, side: 'right' }),
    ).toMatchObject({ side: 'left', left: 224 });
    const wide = resolveOverlayPlacement({
      anchorRect: rect({ left: 250, top: 120, width: 60, height: 20 }),
      overlaySize: { width: 300, height: 80 },
      visibleRect,
      side: 'right',
    });
    expect(wide).toMatchObject({ side: 'left', constrained: true, maxWidth: 244, left: 0 });
    const low = rect({ left: 150, top: 260, width: 60, height: 20 });
    expect(
      resolveOverlayPlacement({ anchorRect: low, overlaySize, visibleRect, side: 'right' }),
    ).toMatchObject({ side: 'right', top: 200, align: 'end' });
  });

  it('UIC-OVERLAY-POSITION-1.7 centres on the anchor and shifts by the cross offset', () => {
    expect(
      resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, align: 'center' }),
    ).toMatchObject({ align: 'center', left: 130, top: 146 });
    expect(
      resolveOverlayPlacement({
        anchorRect,
        overlaySize,
        visibleRect,
        align: 'center',
        crossOffset: 12,
      }),
    ).toMatchObject({ left: 142 });
    expect(
      resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, crossOffset: -8 }),
    ).toMatchObject({ align: 'start', left: 142 });
    expect(
      resolveOverlayPlacement({
        anchorRect,
        overlaySize,
        visibleRect,
        side: 'right',
        align: 'center',
        crossOffset: 5,
      }),
    ).toMatchObject({ align: 'center', top: 95 });
    expect(
      resolveOverlayPlacement({
        anchorRect: rect({ left: 0, top: 120, width: 20, height: 20 }),
        overlaySize,
        visibleRect,
        align: 'center',
      }),
    ).toMatchObject({ left: 0 });
  });

  it('UIC-OVERLAY-POSITION-1.8 reports the room it may take and its anchor point', () => {
    const below = resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect });
    expect(below).toMatchObject({
      availableWidth: 400,
      availableHeight: 154,
      transformOrigin: '30px 0px',
    });
    const above = resolveOverlayPlacement({
      anchorRect,
      overlaySize,
      visibleRect,
      side: 'top',
      align: 'center',
    });
    expect(above).toMatchObject({ availableHeight: 114, transformOrigin: '50px 80px' });
    const beside = resolveOverlayPlacement({ anchorRect, overlaySize, visibleRect, side: 'left' });
    expect(beside).toMatchObject({
      availableWidth: 144,
      availableHeight: 300,
      transformOrigin: '100px 10px',
    });
    const point = resolveOverlayPlacement({
      anchorRect: createOverlayPointRect(390, 20),
      overlaySize,
      visibleRect,
    });
    expect(point).toMatchObject({ align: 'end', left: 290, transformOrigin: '100px 0px' });
    const shifted = resolveOverlayPlacement({
      anchorRect,
      overlaySize,
      visibleRect,
      crossOffset: 80,
    });
    expect(shifted).toMatchObject({ left: 230, transformOrigin: '0px 0px' });
  });
});

describe('withdrawn submenu solver', () => {
  it('UIC-OVERLAY-POSITION-2.1 UIC-OVERLAY-POSITION-2.2 leaves submenus to React Aria', async () => {
    const position = await import('./overlay-position.js');
    expect('resolveSubmenuPlacement' in position).toBe(false);
  });
});
