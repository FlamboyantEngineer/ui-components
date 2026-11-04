// Anchor rectangles in the layer's own coordinates, measured from elements, and hit testing.

import { getElementByIdWithin } from '../../utils/owner-window.js';
import type { Key } from '../../core/props.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toScale } from '../../utils/scroll-geometry.js';
import { clipToAncestors } from './anchor-clip.js';

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

/** An annotation with the rectangles its anchor shows now, and where its anchor starts. */
export interface AnchoredAnnotation {
  annotation: Annotation;
  /** The anchor's visible rectangles, drawn as marks and hit by presses. */
  rects: readonly AnnotationRect[];
  /** The top of the anchor, `null` when it is gone; a hidden anchor keeps its top. */
  top: number | null;
}

/** What a target element's anchor covers now, in the layer's content coordinates. */
export interface MeasuredAnchor {
  /** The visible parts of the element's boxes. */
  rects: AnnotationRect[];
  /** The top of the visible parts, else of the element's boxes. */
  top: number | null;
}

/** The top of the highest rectangle, or `null` for none. */
export function toAnchorTop(rects: readonly AnnotationRect[]): number | null {
  return rects.length === 0 ? null : rects.reduce((top, rect) => Math.min(top, rect.top), Infinity);
}

/** A point in the layer's content coordinates. */
interface LayerPoint {
  x: number;
  y: number;
}

/**
 * Maps viewport coordinates into the layer's content coordinates: from the top left corner inside
 * its border, before its scroll, in its own CSS pixels. A scale its ancestors apply, the same or
 * different across and down, is divided out; a rotation or skew is not supported.
 */
interface LayerFrame {
  toLocalPoint(x: number, y: number): LayerPoint;
  toLocalRect(box: { top: number; left: number; width: number; height: number }): AnnotationRect;
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

/**
 * What each target element inside the layer covers, by annotation id, in its content coordinates:
 * its boxes cut to what the scrolling or clipping elements between it and the layer let show.
 */
export function measureTargets(
  layer: HTMLElement,
  annotations: readonly Annotation[],
): Map<Key, MeasuredAnchor> {
  const frame = getLayerFrame(layer);
  const measured = new Map<Key, MeasuredAnchor>();
  for (const [id, element] of findTargets(layer, annotations)) {
    const boxes = Array.from(element.getClientRects());
    const rects = clipToAncestors(boxes, element, layer).map(frame.toLocalRect);
    measured.set(id, {
      rects,
      top: toAnchorTop(rects) ?? toAnchorTop(boxes.map(frame.toLocalRect)),
    });
  }
  return measured;
}

function isSameRect(a: AnnotationRect, b: AnnotationRect): boolean {
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

/** Whether two measurements hold the same anchors for the same annotations. */
export function isSameMeasurement(
  a: ReadonlyMap<Key, MeasuredAnchor>,
  b: ReadonlyMap<Key, MeasuredAnchor>,
): boolean {
  if (a.size !== b.size) return false;
  for (const [id, anchor] of a) {
    const other = b.get(id);
    if (!other || other.top !== anchor.top || other.rects.length !== anchor.rects.length) {
      return false;
    }
    if (
      !anchor.rects.every((rect, index) => isSameRect(rect, requireDefined(other.rects[index])))
    ) {
      return false;
    }
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
