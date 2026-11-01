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

/** A point in the layer's content coordinates. */
export interface LayerPoint {
  x: number;
  y: number;
}

/**
 * Maps viewport coordinates into the layer's content coordinates: from the top left corner inside
 * its border, before its scroll, in its own CSS pixels. A scale its ancestors apply, the same or
 * different across and down, is divided out; a rotation or skew is not supported.
 */
export interface LayerFrame {
  toLocalPoint(x: number, y: number): LayerPoint;
  toLocalRect(box: { top: number; left: number; width: number; height: number }): AnnotationRect;
}

/** The scale from the layer's own CSS pixels to viewport pixels, 1 for an unlaid-out side. */
function toScale(viewportSize: number, ownSize: number): number {
  return viewportSize > 0 && ownSize > 0 ? viewportSize / ownSize : 1;
}

/** The layer's frame as laid out now. */
export function getLayerFrame(layer: HTMLElement): LayerFrame {
  const box = layer.getBoundingClientRect();
  const scaleX = toScale(box.width, layer.offsetWidth);
  const scaleY = toScale(box.height, layer.offsetHeight);
  const toLocalPoint = (x: number, y: number) => ({
    x: (x - box.left) / scaleX - layer.clientLeft + layer.scrollLeft,
    y: (y - box.top) / scaleY - layer.clientTop + layer.scrollTop,
  });
  return {
    toLocalPoint,
    toLocalRect: (rect) => {
      const { x, y } = toLocalPoint(rect.left, rect.top);
      return { top: y, left: x, width: rect.width / scaleX, height: rect.height / scaleY };
    },
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

/** The boxes of each target element inside the layer, by annotation id, in its content coordinates. */
export function measureTargets(
  layer: HTMLElement,
  annotations: readonly Annotation[],
): Map<Key, AnnotationRect[]> {
  const frame = getLayerFrame(layer);
  const measured = new Map<Key, AnnotationRect[]>();
  for (const [id, element] of findTargets(layer, annotations)) {
    measured.set(id, Array.from(element.getClientRects(), frame.toLocalRect));
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
