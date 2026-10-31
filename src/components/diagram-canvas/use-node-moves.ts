'use client';

import { useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  snapToGrid,
  type DiagramDirection,
  type DiagramEdge,
  type DiagramNode,
} from './diagram-model.js';
import type { DiagramPoint } from './edge-route.js';

interface NodeMovesOptions {
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  selected: ReadonlySet<Key>;
  /** Positions snap to multiples of it; `0` turns snapping off. */
  gridSize: number;
  /** The zoom in percent, to turn screen pixels into diagram pixels. */
  zoom: number;
  onNodesChange: ((nodes: DiagramNode[]) => void) | undefined;
  onEdgesChange: ((edges: DiagramEdge[]) => void) | undefined;
  /** Replaces the selection, after a removal. */
  replaceSelection: (keys: readonly Key[]) => void;
  announce: (message: string) => void;
}

export interface NodeMoves {
  /** Where the nodes being dragged would go, by id, or null while nothing is dragged. */
  preview: ReadonlyMap<Key, DiagramPoint> | null;
  /** Starts a pointer drag of `id`, carrying the selection when it holds `id`. */
  begin: (id: Key) => void;
  /** Previews the drag moved by `delta` screen pixels from where it started. */
  drag: (delta: DiagramPoint) => void;
  /** Applies the previewed drag; false when the nodes did not move. */
  end: () => boolean;
  /** Discards an unfinished pointer move. */
  cancel: () => void;
  /** Moves `id` (and the selection holding it) one grid step, or five with `large`. */
  step: (id: Key, options: { direction: DiagramDirection; large: boolean }) => void;
  /** Removes `id`, or the selection when it holds `id`, with the edges that touch removed nodes. */
  remove: (id: Key) => void;
  /** Removes one edge. */
  removeEdge: (id: Key) => void;
}

interface DragStart {
  anchor: Key;
  origins: Map<Key, DiagramPoint>;
}

const largeStep = 5;
const directions: Record<DiagramDirection, DiagramPoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

/** The positions of the nodes a move of `anchor` carries. */
function collectOrigins(
  nodes: readonly DiagramNode[],
  { anchor, selected }: { anchor: Key; selected: ReadonlySet<Key> },
): Map<Key, DiagramPoint> {
  const carried = selected.has(anchor) ? selected : new Set([anchor]);
  return new Map(
    nodes.filter((node) => carried.has(node.id)).map((node) => [node.id, { x: node.x, y: node.y }]),
  );
}

/** Every origin shifted by the move that takes the anchor to its snapped target. */
function shiftOrigins(start: DragStart, target: DiagramPoint, gridSize: number) {
  const origin = start.origins.get(start.anchor) ?? target;
  const shift = {
    x: snapToGrid(target.x, gridSize) - origin.x,
    y: snapToGrid(target.y, gridSize) - origin.y,
  };
  return new Map(
    [...start.origins].map(([id, point]) => [id, { x: point.x + shift.x, y: point.y + shift.y }]),
  );
}

/** Pointer drags, arrow-key steps and removal of nodes, applied through the change callbacks. */
export function useNodeMoves(options: NodeMovesOptions): NodeMoves {
  const strings = useUiStrings();
  const [preview, setPreview] = useState<ReadonlyMap<Key, DiagramPoint> | null>(null);
  const start = useRef<DragStart | null>(null);
  const { nodes, edges, selected, gridSize, announce } = options;
  const commit = (anchor: Key, moved: ReadonlyMap<Key, DiagramPoint>) => {
    const label = nodes.find((node) => node.id === anchor)?.label ?? '';
    options.onNodesChange?.(
      nodes.map((node) => (moved.has(node.id) ? { ...node, ...moved.get(node.id) } : node)),
    );
    announce(strings.diagramMoved(label, moved.size));
  };
  return {
    preview,
    begin: (anchor) => {
      start.current = { anchor, origins: collectOrigins(nodes, { anchor, selected }) };
    },
    drag: (delta) => {
      const active = start.current;
      const origin = active?.origins.get(active.anchor);
      if (!active || !origin) return;
      const factor = options.zoom / 100;
      const target = { x: origin.x + delta.x / factor, y: origin.y + delta.y / factor };
      setPreview(shiftOrigins(active, target, gridSize));
    },
    end: () => {
      const active = start.current;
      start.current = null;
      setPreview(null);
      const moved = preview && active ? preview : null;
      const origin = active?.origins.get(active.anchor);
      const at = active ? moved?.get(active.anchor) : undefined;
      if (!active || !moved || !at || (at.x === origin?.x && at.y === origin.y)) return false;
      // An anchor the host removed mid-drag ends the drag without a move.
      if (!nodes.some((node) => node.id === active.anchor)) return false;
      commit(active.anchor, moved);
      return true;
    },
    cancel: () => {
      start.current = null;
      setPreview(null);
    },
    step: (anchor, { direction, large }) => {
      const active = { anchor, origins: collectOrigins(nodes, { anchor, selected }) };
      const origin = active.origins.get(anchor);
      if (!origin) return;
      const distance = Math.max(1, gridSize) * (large ? largeStep : 1);
      const unit = directions[direction];
      const target = { x: origin.x + unit.x * distance, y: origin.y + unit.y * distance };
      commit(anchor, shiftOrigins(active, target, gridSize));
    },
    remove: (id) => {
      const keys = selected.has(id) ? selected : new Set([id]);
      const removedNodes = new Set(
        nodes.filter((node) => keys.has(node.id)).map((node) => node.id),
      );
      const isRemovedEdge = (edge: DiagramEdge) =>
        keys.has(edge.id) || removedNodes.has(edge.source) || removedNodes.has(edge.target);
      const removedEdges = edges.filter(isRemovedEdge);
      if (removedNodes.size > 0)
        options.onNodesChange?.(nodes.filter((node) => !removedNodes.has(node.id)));
      if (removedEdges.length > 0)
        options.onEdgesChange?.(edges.filter((edge) => !isRemovedEdge(edge)));
      options.replaceSelection([...selected].filter((key) => !keys.has(key)));
      announce(strings.diagramRemoved(removedNodes.size + removedEdges.length));
    },
    removeEdge: (id) => {
      options.onEdgesChange?.(edges.filter((edge) => edge.id !== id));
      options.replaceSelection([...selected].filter((key) => key !== id));
      announce(strings.diagramRemoved(1));
    },
  };
}
