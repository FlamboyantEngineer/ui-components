// One-axis placement steps shared by the overlay solvers in `overlay-position.ts`: choosing a side
// along the main axis and lining up along the cross axis. "Low" is the left or top edge.

import { clamp } from './clamp.js';

/** How an overlay lines up with its anchor along the anchor's edge. */
export type AxisAlign = 'start' | 'center' | 'end';

export interface CrossAxisInput {
  anchorLow: number;
  anchorHigh: number;
  size: number;
  boundLow: number;
  boundHigh: number;
  align: AxisAlign;
  /** Whether `start` is the low edge: true except for the horizontal axis in right-to-left text. */
  startIsLow: boolean;
  /** Shift toward the high edge, applied after alignment and before clamping. */
  offset: number;
  /** Clamp into the bounds. */
  clamps: boolean;
}

export interface MainAxisInput {
  anchorLow: number;
  anchorHigh: number;
  size: number;
  boundLow: number;
  boundHigh: number;
  gap: number;
  /** Prefer the high side (below or right of the anchor). */
  prefersHigh: boolean;
}

export interface MainAxisPlacement {
  /** The overlay opens on the high side of the anchor. */
  isHigh: boolean;
  /** The overlay's low edge. */
  position: number;
  /** The overlay's size along the axis: its own, or the room on its side when larger. */
  size: number;
  roomLow: number;
  roomHigh: number;
  constrained: boolean;
}

/** Like `clamp`, but a non-finite bound falls back to the low bound (or 0). */
export function clampFinite(value: number, min: number, max: number): number {
  const low = Number.isFinite(min) ? min : 0;
  return clamp(value, low, Number.isFinite(max) ? max : low);
}

/**
 * Lines the overlay up with the anchor's start or end edge (flipping to the other edge when only
 * that one fits) or centres it on the anchor, then shifts and clamps it.
 */
export function alignCrossAxis(input: CrossAxisInput): { align: AxisAlign; position: number } {
  const { anchorLow, anchorHigh, size, boundLow, boundHigh, startIsLow } = input;
  const place = (position: number) =>
    input.clamps
      ? clampFinite(position + input.offset, boundLow, boundHigh - size)
      : position + input.offset;
  if (input.align === 'center') {
    return { align: 'center', position: place((anchorLow + anchorHigh - size) / 2) };
  }
  const lowFits = anchorLow + size <= boundHigh;
  const highFits = anchorHigh - size >= boundLow;
  const prefersLow = (input.align === 'start') === startIsLow;
  const usesLow = prefersLow ? lowFits || !highFits : !highFits && lowFits;
  return {
    align: usesLow === startIsLow ? 'start' : 'end',
    position: place(usesLow ? anchorLow : anchorHigh - size),
  };
}

/**
 * Opens the overlay on the preferred side of the anchor when it fits, on the other side when only
 * that fits, and otherwise on the roomier side (the preferred one on a tie), constrained to it.
 */
export function solveMainAxis(input: MainAxisInput): MainAxisPlacement {
  const { anchorLow, anchorHigh, size, boundLow, boundHigh, gap } = input;
  const roomLow = Math.max(0, Math.floor(anchorLow - boundLow - gap));
  const roomHigh = Math.max(0, Math.floor(boundHigh - anchorHigh - gap));
  const [preferred, other] = input.prefersHigh ? [roomHigh, roomLow] : [roomLow, roomHigh];
  const usesPreferred = preferred >= size || (other < size && preferred >= other);
  const isHigh = usesPreferred === input.prefersHigh;
  const room = isHigh ? roomHigh : roomLow;
  const constrained = size > room;
  const placedSize = Math.max(0, constrained ? room : size);
  return {
    isHigh,
    position: isHigh ? anchorHigh + gap : anchorLow - gap - placedSize,
    size: placedSize,
    roomLow,
    roomHigh,
    constrained,
  };
}

/** The point of the overlay nearest the anchor's middle, along one edge, clamped into the overlay. */
export function resolveAnchorPoint(
  anchorLow: number,
  anchorHigh: number,
  overlay: { low: number; size: number },
) {
  return Math.round(clamp((anchorLow + anchorHigh) / 2 - overlay.low, 0, overlay.size));
}
