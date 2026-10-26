import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type Annotation } from './anchor-geometry.js';
/** What a card shows about its annotation. */
export interface AnnotationCardState {
    /** The annotation is the active one. */
    isActive: boolean;
    /** Its anchor is gone: it has no rectangles and no target element in the layer. */
    isOrphaned: boolean;
}
export interface AnnotationMarginProps extends BaseProps, AriaLabellingProps {
    /** Draws an annotation's card. */
    renderCard: (annotation: Annotation, state: AnnotationCardState) => ReactNode;
    /** Space kept between stacked cards, in pixels. Defaults to 8. */
    gap?: number | undefined;
}
/**
 * Lays out a card for each annotation of the layer around it, level with its anchor and stacked
 * without overlap, the active card kept level with its anchor. The cards are a list; arrow keys,
 * Home and End move between them, and focusing a card makes its annotation active.
 */
export declare function AnnotationMargin({ renderCard, gap, className, ...rest }: AnnotationMarginProps): import("react").JSX.Element;
//# sourceMappingURL=annotation-margin.d.ts.map