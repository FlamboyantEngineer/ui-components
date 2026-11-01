// Anchor rectangles in the layer's own coordinates, measured from elements, and hit testing.

import { getElementByIdWithin } from '../../utils/owner-window.js';
import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';

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
export function getLayerOrigin(layer: Element): { top: number; left: number } {
  const box = layer.getBoundingClientRect();
  return {
    top: box.top + layer.clientTop - layer.scrollTop,
    left: box.left + layer.clientLeft - layer.scrollLeft,
  };
}

/** The target element of each annotation anchored by one inside the layer, by annotation id. */
export function findTargets(layer: Element, annotations: readonly Annotation[]): Map<Key, Element> {
  const targets = new Map<Key, Element>();
  for (const { id, rects, targetId } of annotations) {
    if (rects || targetId === undefined) continue;
    const element = getElementByIdWithin(layer, targetId);
    if (element) targets.set(id, element);
  }
  return targets;
}

/** The boxes of each target element inside the layer, by annotation id. */
export function measureTargets(
  layer: Element,
  annotations: readonly Annotation[],
): Map<Key, AnnotationRect[]> {
  const origin = getLayerOrigin(layer);
  const measured = new Map<Key, AnnotationRect[]>();
  for (const [id, element] of findTargets(layer, annotations)) {
    measured.set(
      id,
      Array.from(element.getClientRects(), (box) => ({
        top: box.top - origin.top,
        left: box.left - origin.left,
        width: box.width,
        height: box.height,
      })),
    );
  }
  return measured;
}

/** Whether two measurements hold the same rectangles for the same annotations. */
export function isSameMeasurement(
  a: ReadonlyMap<Key, readonly AnnotationRect[]>,
  b: ReadonlyMap<Key, readonly AnnotationRect[]>,
): boolean {
  if (a.size !== b.size) return false;
  for (const [id, rects] of a) {
    const other = b.get(id);
    if (!other || other.length !== rects.length) return false;
    const isSame = rects.every((rect, index) => {
      const next = requireDefined(other[index]);
      return (
        rect.top === next.top &&
        rect.left === next.left &&
        rect.width === next.width &&
        rect.height === next.height
      );
    });
    if (!isSame) return false;
  }
  return true;
}

/** The annotation drawn on top at a point of the layer's content (the last one listed), or null. */
export function findAnnotationAt(
  anchors: readonly AnchoredAnnotation[],
  point: { x: number; y: number },
): Key | null {
  const hit = anchors.findLast(({ rects }) =>
    rects.some(
      (rect) =>
        point.x >= rect.left &&
        point.x <= rect.left + rect.width &&
        point.y >= rect.top &&
        point.y <= rect.top + rect.height,
    ),
  );
  return hit ? hit.annotation.id : null;
}
