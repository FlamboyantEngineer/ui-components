import { type RefObject, type ReactNode } from 'react';
import type { OverlayMeasurement } from './use-overlay-metrics.js';
export interface OverlayScrollbarsProps {
    /** Tab order of the thumbs; native editable viewports already provide keyboard scrolling. */
    tabIndex?: 0 | -1 | undefined;
    /** Decorations inside the vertical track, behind the thumb. */
    verticalMarks?: ReactNode;
    /** The natively scrolling viewport the thumbs scroll. */
    viewport: RefObject<HTMLElement | null>;
    /** The viewport's id, which each thumb controls. */
    viewportId: string | undefined;
    /** The viewport's measured geometry and track refs. */
    measurement: OverlayMeasurement;
    /** Draw the horizontal track. */
    drawX: boolean;
    /** Draw the vertical track. */
    drawY: boolean;
    /** The visibility mode shows the tracks now; a focused thumb also keeps them shown. */
    isVisible: boolean;
}
/** Smallest thumb length, so a thumb over very long content stays easy to grab. */
export declare const MIN_THUMB_SIZE = 24;
/** Arrow keys on a thumb scroll this many pixels. */
export declare const THUMB_ARROW_STEP = 40;
/**
 * Overlay thumbs for a natively scrolling viewport: content, wheel and touch scrolling stay native,
 * and React draws only the thumbs, positioned with inline offsets inside tracks the stylesheet places.
 * Tracks show and hide with the visibility mode, staying mounted through their exit.
 */
export declare function OverlayScrollbars({ viewport, viewportId, measurement, drawX, drawY, isVisible, verticalMarks, tabIndex, }: OverlayScrollbarsProps): import("react").JSX.Element;
//# sourceMappingURL=overlay-scrollbars.d.ts.map