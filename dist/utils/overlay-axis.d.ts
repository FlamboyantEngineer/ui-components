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
export declare function clampFinite(value: number, min: number, max: number): number;
/**
 * Lines the overlay up with the anchor's start or end edge (flipping to the other edge when only
 * that one fits) or centres it on the anchor, then shifts and clamps it.
 */
export declare function alignCrossAxis(input: CrossAxisInput): {
    align: AxisAlign;
    position: number;
};
/**
 * Opens the overlay on the preferred side of the anchor when it fits, on the other side when only
 * that fits, and otherwise on the roomier side (the preferred one on a tie), constrained to it.
 */
export declare function solveMainAxis(input: MainAxisInput): MainAxisPlacement;
/** The point of the overlay nearest the anchor's middle, along one edge, clamped into the overlay. */
export declare function resolveAnchorPoint(anchorLow: number, anchorHigh: number, overlay: {
    low: number;
    size: number;
}): number;
//# sourceMappingURL=overlay-axis.d.ts.map