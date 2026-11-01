'use client';

import { measureScale, type ElementScale } from '../../utils/element-scale.js';
import { useState } from 'react';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
import type { SelectionMode } from '../../core/props.js';
import {
  isRectOverlap,
  resolveNodeRect,
  toDiagramPoint,
  type DiagramViewport,
} from './diagram-model.js';
import type { DiagramRect } from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';

interface BackgroundStart {
  x: number;
  y: number;
  left: number;
  top: number;
  origin: DiagramViewport;
  /** Viewport pixels per canvas pixel, so pan and marquee follow the pointer at any scale. */
  scale: ElementScale;
  mode: 'pan' | 'marquee';
  isMoved: boolean;
}

const dragThreshold = 3;

function spanRect(a: { x: number; y: number }, b: { x: number; y: number }): DiagramRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/**
 * Pointer drags on the canvas background: a drag pans the view, a Shift drag draws a marquee that
 * selects the nodes it touches, and a press that does not move clears the selection and gives up a
 * connection in progress.
 */
export function useBackgroundPointer(controller: DiagramController, selectionMode: SelectionMode) {
  const [marquee, setMarquee] = useState<DiagramRect | null>(null);
  const { view, selection, connect } = controller;
  const selectWithin = (rect: DiagramRect) => {
    const from = toDiagramPoint(view.viewport, rect);
    const to = toDiagramPoint(view.viewport, { x: rect.x + rect.width, y: rect.y + rect.height });
    const area = spanRect(from, to);
    selection.replace(
      controller.nodes
        .filter((node) => isRectOverlap(resolveNodeRect(node), area))
        .map((node) => node.id),
    );
  };
  const pointerProps = usePointerDrag<HTMLElement, BackgroundStart>({
    onStart: (event) => {
      const box = event.currentTarget.getBoundingClientRect();
      return {
        x: event.clientX,
        y: event.clientY,
        left: box.left,
        top: box.top,
        scale: measureScale(event.currentTarget),
        origin: view.viewport,
        mode: event.shiftKey && selectionMode === 'multiple' ? 'marquee' : 'pan',
        isMoved: false,
      };
    },
    onMove: (event, active) => {
      const { scale } = active;
      const delta = {
        x: (event.clientX - active.x) / scale.x,
        y: (event.clientY - active.y) / scale.y,
      };
      if (!active.isMoved && Math.hypot(delta.x, delta.y) < dragThreshold) return;
      active.isMoved = true;
      if (active.mode === 'pan') {
        view.setViewport({
          ...active.origin,
          x: active.origin.x + delta.x,
          y: active.origin.y + delta.y,
        });
        return;
      }
      const local = (x: number, y: number) => ({
        x: (x - active.left) / scale.x,
        y: (y - active.top) / scale.y,
      });
      setMarquee(spanRect(local(active.x, active.y), local(event.clientX, event.clientY)));
    },
    onEnd: (_event, active, isCancelled) => {
      if (!isCancelled) {
        if (!active.isMoved) {
          connect.cancel();
          selection.replace([]);
        } else if (marquee) selectWithin(marquee);
      }
      setMarquee(null);
    },
  });
  return {
    marquee,
    pointerProps,
  };
}
