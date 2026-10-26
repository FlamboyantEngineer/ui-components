import type { ReactNode } from 'react';
import type { CarouselAutoplay } from './use-carousel-autoplay.js';
/** How a carousel lets the reader pick a slide directly. */
export type CarouselPagination = 'dots' | 'thumbnails' | 'none';
export interface CarouselControlsProps {
    /** The slide element the buttons change. */
    viewportId: string;
    canGoPrevious: boolean;
    canGoNext: boolean;
    onPrevious: () => void;
    onNext: () => void;
    /** The rotation button's state, when the carousel rotates on its own. */
    rotation?: Pick<CarouselAutoplay, 'isStopped' | 'toggle' | 'rotationRef'> | undefined;
}
export interface CarouselPaginationProps {
    pagination: Exclude<CarouselPagination, 'none'>;
    count: number;
    index: number;
    viewportId: string;
    onSelect: (index: number) => void;
    renderThumbnail?: ((index: number) => ReactNode) | undefined;
}
/** The rotation button, then the previous and next buttons. */
export declare function CarouselControls({ viewportId, canGoPrevious, canGoNext, onPrevious, onNext, rotation, }: CarouselControlsProps): import("react").JSX.Element;
/** One button per slide, as a dot or as the caller's thumbnail, marking the shown slide current. */
export declare function CarouselPaginationButtons({ pagination, count, index, viewportId, onSelect, renderThumbnail, }: CarouselPaginationProps): import("react").JSX.Element;
//# sourceMappingURL=carousel-parts.d.ts.map