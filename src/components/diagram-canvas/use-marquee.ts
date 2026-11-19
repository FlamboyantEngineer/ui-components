'use client';

import { type PointerEvent, useState } from 'react';
import type { SelectionMode } from '../../core/props.js';
import { toLocalPoint } from '../../utils/element-scale.js';
import { useLatest } from '../../utils/use-latest.js';
import type { CanvasGesture } from '../canvas-viewport/index.js';
import { isRectOverlap, resolveNodeRect, toDiagramPoint } from './diagram-model.js';
import type { DiagramPoint, DiagramRect } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';

function spanRect(a: DiagramPoint, b: DiagramPoint): DiagramRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** Shift-drag selects the nodes touched by a marquee. A background click clears selection. */
export function useMarquee(controller: DiagramController, selectionMode: SelectionMode) {
  const [marquee, setMarquee] = useState<DiagramRect | null>(null);
  const latest = useLatest(controller);
  const startGesture = (event: PointerEvent<HTMLDivElement>): CanvasGesture | undefined => {
    if (!event.shiftKey || selectionMode !== 'multiple') return undefined;
    const surface = event.currentTarget;
    const start = toLocalPoint(surface, { x: event.clientX, y: event.clientY });
    let draft: DiagramRect | null = null;
    return {
      onPreview: ({ client }) => {
        draft = spanRect(start, toLocalPoint(surface, client));
        setMarquee(draft);
      },
      onCommit: () => {
        if (draft) {
          const { view, nodes, selection } = latest.current;
          const from = toDiagramPoint(view.viewport, draft);
          const to = toDiagramPoint(view.viewport, {
            x: draft.x + draft.width,
            y: draft.y + draft.height,
          });
          const area = spanRect(from, to);
          selection.replace(
            nodes
              .filter((node) => isRectOverlap(resolveNodeRect(node), area))
              .map((node) => node.id),
          );
        }
        setMarquee(null);
      },
      onCancel: () => setMarquee(null),
    };
  };
  return {
    marquee,
    background: {
      // Nodes, edges and the minimap handle their own presses before the viewport sees them.
      acceptsTarget: () => true,
      threshold: 3,
      startGesture,
      onPress: () => {
        controller.connect.cancel();
        controller.selection.replace([]);
      },
    },
  };
}
