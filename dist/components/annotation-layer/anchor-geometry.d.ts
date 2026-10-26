import type { Key } from '../../core/props.js';
/** A rectangle in pixels from the top left corner of the layer's content. */
export interface AnnotationRect {
    top: number;
    left: number;
    width: number;
    height: number;
}
/** An anchored annotation: where its anchor is drawn, as caller rectangles or a target element. */
export interface Annotation {
    /** Identifies the annotation. */
    id: Key;
    /** The anchor's rectangles, in pixels from the top left corner of the layer's content. */
    rects?: readonly AnnotationRect[] | undefined;
    /** The id of an element inside the layer whose boxes are the anchor, when `rects` is unset. */
    targetId?: string | undefined;
}
/** An annotation with the rectangles its anchor covers now; none when the anchor is gone. */
export interface AnchoredAnnotation {
    annotation: Annotation;
    rects: readonly AnnotationRect[];
}
/** Where the layer's content starts in the viewport: inside its border, before its scroll. */
export declare function getLayerOrigin(layer: Element): {
    top: number;
    left: number;
};
/** The boxes of each target element inside the layer, by annotation id. */
export declare function measureTargets(layer: Element, annotations: readonly Annotation[]): Map<Key, AnnotationRect[]>;
/** Whether two measurements hold the same rectangles for the same annotations. */
export declare function isSameMeasurement(a: ReadonlyMap<Key, readonly AnnotationRect[]>, b: ReadonlyMap<Key, readonly AnnotationRect[]>): boolean;
/** The annotation drawn on top at a point of the layer's content (the last one listed), or null. */
export declare function findAnnotationAt(anchors: readonly AnchoredAnnotation[], point: {
    x: number;
    y: number;
}): Key | null;
//# sourceMappingURL=anchor-geometry.d.ts.map