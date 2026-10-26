import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type CarouselPagination } from './carousel-parts.js';
export type { CarouselPagination } from './carousel-parts.js';
export interface CarouselProps extends BaseProps, AriaLabellingProps {
    /** The slides, one child each. */
    children: ReactNode;
    /** The shown slide's index (controlled). */
    index?: number | undefined;
    /** The slide shown first (uncontrolled). Defaults to 0. */
    defaultIndex?: number | undefined;
    /** Called with the index of each slide moved to. */
    onIndexChange?: ((index: number) => void) | undefined;
    /** How the reader picks a slide directly: `dots` (the default), `thumbnails` or `none`. */
    pagination?: CarouselPagination | undefined;
    /** A slide's thumbnail with `pagination="thumbnails"`; its button is named, so images are decorative. */
    renderThumbnail?: ((index: number) => ReactNode) | undefined;
    /** Previous on the first slide shows the last, and next on the last shows the first. */
    loop?: boolean | undefined;
    /** Advances on its own, pausing while hovered or focused and starting stopped for reduced motion. */
    autoplay?: boolean | undefined;
    /** The time each slide shows with `autoplay`, in milliseconds. Defaults to 5000. */
    interval?: number | undefined;
}
/**
 * Slides shown one at a time, following the ARIA carousel pattern: previous and next buttons,
 * dots or thumbnails, the arrow keys, and optional automatic rotation with a button that stops it.
 */
export declare function Carousel({ children, index: indexProp, defaultIndex, onIndexChange, pagination, renderThumbnail, loop, autoplay, interval, className, ...rest }: CarouselProps): import("react").JSX.Element;
//# sourceMappingURL=carousel.d.ts.map