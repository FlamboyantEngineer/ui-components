'use client';

import type { PointerEvent } from 'react';
import { requireDefined } from '../../utils/require-defined.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { findDiagramBounds, resolveNodeRect } from './diagram-model.js';
import type { DiagramPoint, DiagramRect } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';

interface DiagramMinimapProps {
  controller: DiagramController;
}

const minimapPadding = 40;

/** The diagram point under a screen point of an SVG drawn with `viewBox` and centred to fit. */
function toViewBoxPoint(
  element: SVGSVGElement,
  viewBox: DiagramRect,
  client: DiagramPoint,
): DiagramPoint {
  const box = element.getBoundingClientRect();
  const scale = Math.min(box.width / viewBox.width, box.height / viewBox.height) || 1;
  const left = box.left + (box.width - viewBox.width * scale) / 2;
  const top = box.top + (box.height - viewBox.height * scale) / 2;
  return { x: viewBox.x + (client.x - left) / scale, y: viewBox.y + (client.y - top) / scale };
}

/**
 * A small overview of every node and the part of the diagram in view. Pressing or dragging on it
 * centres the view there. It repeats what the canvas shows, so it is hidden from assistive
 * technology.
 */
export function DiagramMinimap({ controller }: DiagramMinimapProps) {
  const { view, nodes, selection } = controller;
  const size = view.size;
  const factor = view.viewport.zoom / 100;
  const visible = {
    x: -view.viewport.x / factor,
    y: -view.viewport.y / factor,
    width: (size?.width ?? 0) / factor,
    height: (size?.height ?? 0) / factor,
  };
  const viewBox = requireDefined(
    findDiagramBounds([...nodes.map(resolveNodeRect), visible], minimapPadding),
  );
  const centreAt = (event: PointerEvent<SVGSVGElement>) => {
    const point = toViewBoxPoint(event.currentTarget, viewBox, {
      x: event.clientX,
      y: event.clientY,
    });
    view.setViewport({
      ...view.viewport,
      x: (size?.width ?? 0) / 2 - point.x * factor,
      y: (size?.height ?? 0) / 2 - point.y * factor,
    });
  };
  const drag = usePointerDrag<SVGSVGElement, boolean>({
    onStart: (event) => {
      if (!size || nodes.length === 0) return null;
      event.stopPropagation();
      centreAt(event);
      return true;
    },
    onMove: (event) => {
      event.stopPropagation();
      centreAt(event);
    },
    onEnd: (event) => event.stopPropagation(),
  });
  if (!size || nodes.length === 0) return null;
  return (
    <svg
      {...hooks.slot('minimap')}
      aria-hidden="true"
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      style={{ touchAction: 'none' }}
      {...drag}
    >
      {nodes.map((node) => {
        const rect = resolveNodeRect(node);
        return (
          <rect
            key={toKeyIdentity(node.id)}
            {...hooks.slot('minimap-node', { selected: selection.selected.has(node.id) })}
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
          />
        );
      })}
      <rect {...hooks.slot('minimap-viewport')} {...visible} fill="none" />
    </svg>
  );
}
