import { type RefObject } from 'react';
import { type ScrollOverviewLayer, type ScrollOverviewMarker } from '../../utils/scroll-overview.js';
export interface ScrollOverviewOptions {
    markers: readonly ScrollOverviewMarker[] | undefined;
    /** Named marker layers; they replace `markers`. */
    layers: readonly ScrollOverviewLayer[] | undefined;
    /** Paint at all; the overview belongs to native scrollbars. */
    enabled: boolean;
}
export interface ScrollOverviewPaint {
    visible: boolean;
    /** The overview image for the viewport's visible height, or `none`. */
    image: string;
    /** The viewport's visible height in pixels. */
    height: number;
}
/**
 * Measures the viewport's visible and content heights and turns the markers into an overview image.
 * It paints only: scrolling, the native scrollbar and its hit testing are untouched. Observers and the
 * pending frame are released when the markers go away or the region unmounts.
 */
export declare function useScrollOverview(viewport: RefObject<HTMLDivElement | null>, { markers, layers, enabled }: ScrollOverviewOptions): ScrollOverviewPaint;
//# sourceMappingURL=use-scroll-overview.d.ts.map