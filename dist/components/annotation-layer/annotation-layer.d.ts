import { type ReactNode } from 'react';
import type { BaseProps, Key } from '../../core/props.js';
import { type Annotation } from './anchor-geometry.js';
export { AnnotationMargin } from './annotation-margin.js';
export type { AnnotationCardState, AnnotationMarginProps } from './annotation-margin.js';
export type { Annotation, AnnotationRect } from './anchor-geometry.js';
export interface AnnotationLayerProps extends BaseProps {
    /** The annotations, each anchored by rectangles or by an element inside the layer. */
    annotations: readonly Annotation[];
    /** The active annotation, controlled; `null` for none. */
    activeId?: Key | null | undefined;
    /** The annotation active at first, uncontrolled. */
    defaultActiveId?: Key | null | undefined;
    /** Called with the annotation that becomes active. */
    onActiveChange?: ((id: Key | null) => void) | undefined;
    /** The annotated content, and usually an `AnnotationMargin` beside it. */
    children?: ReactNode;
}
/**
 * Draws the anchors of annotations over its content as highlight marks: caller rectangles, or the
 * boxes of elements inside it, measured again when the layer resizes. Pressing a mark makes its
 * annotation active; an `AnnotationMargin` inside lays out a card for each annotation.
 */
export declare function AnnotationLayer({ annotations, activeId, defaultActiveId, onActiveChange, children, className, ...rest }: AnnotationLayerProps): import("react").JSX.Element;
//# sourceMappingURL=annotation-layer.d.ts.map