import { type RefObject } from 'react';
/** Registers a sticky header to keep the vertical thumb below; returns its unregistration. */
export type HeaderRegistration = (element: HTMLElement | null) => (() => void) | undefined;
/** The viewport's measured geometry, as the overlay scrollbars draw it. */
export interface OverlayMetrics {
    width: number;
    height: number;
    contentWidth: number;
    contentHeight: number;
    top: number;
    /** The horizontal scroll position from the left edge, also in right-to-left viewports. */
    left: number;
    /** The tallest registered header. */
    header: number;
    rtl: boolean;
    /** Empty height below content shorter than the viewport. */
    lift: number;
    trackX: number;
    trackY: number;
}
export interface OverlayMetricsOptions {
    viewport: RefObject<HTMLElement | null>;
    /** Overlay mode is on; otherwise nothing is measured. */
    enabled: boolean;
    /** Measure registered headers and keep the vertical thumb below them. */
    headerInset: boolean;
}
export interface OverlayMeasurement {
    metrics: OverlayMetrics;
    /** Schedules a measurement for the next animation frame. */
    schedule: () => void;
    /** Header registration, when header insets are on. */
    registerHeader: HeaderRegistration | undefined;
    verticalTrackRef: (element: HTMLElement | null) => void;
    horizontalTrackRef: (element: HTMLElement | null) => void;
}
/**
 * Measures a natively scrolling viewport for overlay thumbs: its size, content size and position,
 * its registered headers and the tracks the stylesheet places. Re-measures once per animation frame
 * when any of them resizes, the content changes or `schedule` is called.
 */
export declare function useOverlayMetrics({ viewport, enabled, headerInset, }: OverlayMetricsOptions): OverlayMeasurement;
//# sourceMappingURL=use-overlay-metrics.d.ts.map