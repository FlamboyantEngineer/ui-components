import type { Key } from '../../core/props.js';
import type { CanvasPoint } from '../../utils/canvas-transform.js';
import type { CanvasAnchorEndpoint } from './canvas-viewport-types.js';

export interface CanvasElementLayout {
  /** Unique in the scene, including descendants. */
  id: Key;
  /** Origin relative to the parent, or in world units for a top-level element. */
  position: CanvasPoint;
  /** Named offsets from the element's origin. */
  anchors?: readonly { id: string; position: CanvasPoint }[] | undefined;
  children?: readonly CanvasElementLayout[] | undefined;
}

/** Resolves the anchors of a caller-owned layout to world points for paths. */
export function resolveCanvasAnchors(
  elements: readonly CanvasElementLayout[],
): (endpoint: CanvasAnchorEndpoint) => CanvasPoint | undefined {
  const anchors = new Map<Key, Map<string, CanvasPoint>>();
  const visit = (element: CanvasElementLayout, parent: CanvasPoint) => {
    const x = parent.x + element.position.x;
    const y = parent.y + element.position.y;
    if (element.anchors) {
      const local = new Map<string, CanvasPoint>();
      for (const anchor of element.anchors)
        local.set(anchor.id, { x: x + anchor.position.x, y: y + anchor.position.y });
      anchors.set(element.id, local);
    }
    for (const child of element.children ?? []) visit(child, { x, y });
  };
  for (const element of elements) visit(element, { x: 0, y: 0 });
  return ({ elementId, anchorId }) => anchors.get(elementId)?.get(anchorId);
}
