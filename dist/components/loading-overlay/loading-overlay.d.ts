import { type ReactNode, type Ref } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type ProgressBarProps } from '../progress-bar/progress-bar.js';
/** Measured progress for the card's bar. Without it, or when indeterminate, the bar has no level. */
export type LoadingProgress = Pick<ProgressBarProps, 'value' | 'minValue' | 'maxValue' | 'valueLabel' | 'formatOptions' | 'isIndeterminate' | 'aria-label'>;
/** A phase counter: `current` of `total`, both whole numbers. */
export interface LoadingStep {
    current: number;
    total: number;
}
export interface LoadingCardProps extends BaseProps {
    /** What is loading; the card announces it politely. Defaults to the provider's `loading` string. */
    label?: ReactNode;
    /** A longer explanation under the bar. */
    description?: ReactNode;
    /** The current piece of work, kept out of the announcement; cut text keeps a tooltip. */
    hint?: ReactNode;
    /** Measured progress; omit for an indeterminate bar. */
    progress?: LoadingProgress | undefined;
    /** The current phase, shown as "current of total". */
    step?: LoadingStep | undefined;
}
export type LoadingOverlayPresentation = 'card' | 'scrim';
export interface LoadingOverlayProps extends LoadingCardProps {
    /**
     * `card` (the default) centres the status card on the scrim. `scrim` draws the cover alone, hidden
     * from assistive technology, for secondary regions that load together with a primary one.
     */
    presentation?: LoadingOverlayPresentation | undefined;
    /** Milliseconds the work must last before the overlay shows, so quick work never flashes it. */
    delay?: number | undefined;
    /** Cover the viewport from the overlay layer instead of the positioned parent. */
    fullscreen?: boolean | undefined;
    /** The overlay has just appeared; publishes `data-entering` for an enter animation. */
    isEntering?: boolean | undefined;
    /** The overlay is on its way out; publishes `data-exiting` for an exit transition. */
    isExiting?: boolean | undefined;
    /** The cover element, for example for `useEnterExit`. */
    ref?: Ref<HTMLDivElement> | undefined;
}
export interface LoadingRegionProps extends Omit<LoadingOverlayProps, 'isEntering' | 'isExiting' | 'ref'> {
    /** While true (after `delay`) the region is busy, its content is inert and the overlay covers it. */
    isLoading?: boolean | undefined;
    /** The region's content. */
    children?: ReactNode;
}
/**
 * The loading status card: label, optional percentage, one progress bar, an optional description
 * and a footer pairing the current-work hint with a step counter. Only the label and description
 * are announced; progress, hint and step changes stay quiet.
 */
export declare function LoadingCard({ label, description, hint, progress, step, className, ...rest }: LoadingCardProps): import("react").JSX.Element;
/**
 * A cover for a positioned surface that is loading, with the status card centred on it. The
 * stylesheet stretches it over its positioned parent, or over the viewport when `fullscreen`; mount
 * it only while the work runs. With `delay` it shows only once the work has lasted that long.
 */
export declare function LoadingOverlay({ presentation, delay, fullscreen, isEntering, isExiting, className, id, ref, ...rest }: LoadingOverlayProps): import("react").JSX.Element | null;
/**
 * A bounded region that blocks its own content while loading: it is marked busy, its content is
 * inert (no pointer, focus or assistive-technology access) and a `LoadingOverlay` covers it; focus
 * that was in the content waits on the region and returns once loading ends. With
 * `delay` all of it waits until the work has lasted that long; the overlay stays mounted through its
 * exit transition (`useEnterExit`).
 */
export declare function LoadingRegion({ isLoading, delay, children, className, id, ...rest }: LoadingRegionProps): import("react").JSX.Element;
//# sourceMappingURL=loading-overlay.d.ts.map