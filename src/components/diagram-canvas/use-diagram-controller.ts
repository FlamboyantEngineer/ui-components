'use client';

import { useCallback, useMemo, useState, type RefCallback } from 'react';
import type { Key, Selection, SelectionMode } from '../../core/props.js';
import { indexDiagramLinks, type DiagramLinks } from './diagram-links.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import {
  findDiagramBounds,
  resolveNodeRect,
  toDiagramPoint,
  type DiagramEdge,
  type DiagramNode,
  type DiagramViewport,
} from './diagram-model.js';
import type { DiagramPoint } from './edge-route.js';
import {
  useDiagramConnect,
  type DiagramConnect,
  type DiagramConnection,
} from './use-diagram-connect.js';
import { useDiagramSelection, type DiagramSelection } from './use-diagram-selection.js';
import { useDiagramViewport, type DiagramViewportState } from './use-diagram-viewport.js';
import { useNodeMoves, type NodeMoves } from './use-node-moves.js';

/** A node, or one of its ports, under the pointer. */
export interface DiagramTarget {
  node: Key;
  port?: string | undefined;
}

interface DiagramControllerOptions {
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  isEditing: boolean;
  gridSize: number;
  selectionMode: SelectionMode;
  selectedKeys: Iterable<Key> | 'all' | undefined;
  defaultSelectedKeys: Iterable<Key> | 'all' | undefined;
  onSelectionChange: ((keys: Selection) => void) | undefined;
  viewport: DiagramViewport | undefined;
  defaultViewport: DiagramViewport | undefined;
  onViewportChange: ((viewport: DiagramViewport) => void) | undefined;
  onNodesChange: ((nodes: DiagramNode[]) => void) | undefined;
  onEdgesChange: ((edges: DiagramEdge[]) => void) | undefined;
  onConnect: ((connection: DiagramConnection) => void) | undefined;
}

/** What the parts of a canvas share: the data, its interaction state and element lookups. */
export interface DiagramController {
  /** The nodes with any dragged positions applied. */
  nodes: readonly DiagramNode[];
  edges: readonly DiagramEdge[];
  links: ReadonlyMap<Key, DiagramLinks>;
  isEditing: boolean;
  selection: DiagramSelection;
  moves: NodeMoves;
  connect: DiagramConnect;
  view: DiagramViewportState;
  viewportElement: HTMLElement | null;
  setViewportElement: (element: HTMLElement | null) => void;
  /** The ref callback that registers a node's element, or a port's, as a connection target. */
  registerTarget: (target: DiagramTarget) => RefCallback<HTMLElement>;
  focusNode: (id: Key) => void;
  /** The node or port at a screen point. */
  findTarget: (clientX: number, clientY: number) => DiagramTarget | null;
  /** The diagram point at a screen point. */
  toDiagram: (clientX: number, clientY: number) => DiagramPoint;
  /** The latest announcement; `id` changes with each one, so the same text is read again. */
  message: DiagramMessage;
  announce: (message: string) => void;
}

export interface DiagramMessage {
  text: string;
  id: number;
}

function applyPreview(
  nodes: readonly DiagramNode[],
  preview: ReadonlyMap<Key, DiagramPoint> | null,
): readonly DiagramNode[] {
  if (!preview) return nodes;
  return nodes.map((node) => (preview.has(node.id) ? { ...node, ...preview.get(node.id) } : node));
}

/** Element lookups for nodes and ports, kept by ref callbacks; the same functions every render. */
function createTargetRegistry() {
  const targets = new Map<Element, DiagramTarget>();
  return {
    registerTarget:
      (target: DiagramTarget): RefCallback<HTMLElement> =>
      (element) => {
        if (!element) return undefined;
        targets.set(element, target);
        return () => {
          targets.delete(element);
        };
      },
    focusNode: (id: Key) => {
      for (const [element, target] of targets) {
        if (target.node === id && target.port === undefined) (element as HTMLElement).focus();
      }
    },
    findTarget: (clientX: number, clientY: number) => {
      const hit = document.elementFromPoint(clientX, clientY);
      const element = hit?.closest(`.${hooks.slotClass('port')}, .${hooks.slotClass('node')}`);
      return (element && targets.get(element)) ?? null;
    },
  };
}

/** The live region's text, renewed by each announcement even when the text repeats. */
function useAnnouncer() {
  const [message, setMessage] = useState<DiagramMessage>({ text: '', id: 0 });
  const announce = useCallback(
    (text: string) => setMessage((current) => ({ text, id: current.id + 1 })),
    [],
  );
  return [message, announce] as const;
}

/** The state and services of one diagram canvas. */
export function useDiagramController(options: DiagramControllerOptions): DiagramController {
  const { edges, isEditing } = options;
  const links = useMemo(() => indexDiagramLinks(options.nodes, edges), [options.nodes, edges]);
  const [message, announce] = useAnnouncer();
  const [viewportElement, setViewportElement] = useState<HTMLElement | null>(null);
  const bounds = useMemo(
    () => findDiagramBounds(options.nodes.map(resolveNodeRect)),
    [options.nodes],
  );
  const view = useDiagramViewport({
    viewport: options.viewport,
    defaultViewport: options.defaultViewport,
    onViewportChange: options.onViewportChange,
    element: viewportElement,
    bounds,
  });
  const allKeys = [...options.nodes.map((node) => node.id), ...edges.map((edge) => edge.id)];
  const selection = useDiagramSelection({ ...options, allKeys });
  const moves = useNodeMoves({
    ...options,
    selected: selection.selected,
    zoom: view.viewport.zoom,
    replaceSelection: selection.replace,
    announce,
  });
  const connect = useDiagramConnect({
    nodes: options.nodes,
    isEditing,
    onConnect: options.onConnect,
    announce,
  });
  const [registry] = useState(createTargetRegistry);
  const toDiagram = (clientX: number, clientY: number) => {
    const box = viewportElement?.getBoundingClientRect();
    return toDiagramPoint(view.viewport, {
      x: clientX - (box?.left ?? 0),
      y: clientY - (box?.top ?? 0),
    });
  };
  return {
    nodes: applyPreview(options.nodes, moves.preview),
    edges,
    links,
    isEditing,
    selection,
    moves,
    connect,
    view,
    viewportElement,
    setViewportElement,
    ...registry,
    toDiagram,
    message,
    announce,
  };
}
