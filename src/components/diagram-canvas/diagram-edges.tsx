import { useMemo, useState, type PointerEvent } from 'react';
import type { Key } from '../../core/props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import {
  findDiagramBounds,
  resolveNodeRect,
  spreadParallelEdges,
  type DiagramEdge,
  type DiagramNode,
} from './diagram-model.js';
import {
  routeDiagramEdge,
  type DiagramEdgeEnd,
  type DiagramEdgeRouting,
  type DiagramRoute,
} from './edge-route.js';
import type { DiagramController } from './use-diagram-controller.js';

interface DiagramEdgesProps {
  controller: DiagramController;
  routing: DiagramEdgeRouting;
}

interface RoutedEdge {
  edge: DiagramEdge;
  route: DiagramRoute;
}

/** An edge's route with what it was routed from, reused while none of that changes. */
interface CachedRoute {
  source: DiagramNode;
  target: DiagramNode;
  routing: DiagramEdgeRouting;
  offset: number;
  route: DiagramRoute;
}

const layerPadding = 96;

function resolveEnd(node: DiagramNode, portId: string | undefined): DiagramEdgeEnd {
  const port = node.ports?.find((item) => item.id === portId);
  return {
    rect: resolveNodeRect(node),
    port: port ? { side: port.side, position: port.position ?? 0.5 } : undefined,
  };
}

/**
 * Every edge with its route. Routes are kept per edge and reused while the edge, its two nodes, the
 * routing and its offset stay the same, so dragging one node re-routes only the edges touching it.
 */
function useRoutedEdges(controller: DiagramController, routing: DiagramEdgeRouting): RoutedEdge[] {
  const [cache] = useState(() => new WeakMap<DiagramEdge, CachedRoute>());
  const offsets = useMemo(() => spreadParallelEdges(controller.edges), [controller.edges]);
  const byId = new Map(controller.nodes.map((node) => [node.id, node]));
  return controller.edges.flatMap((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) return [];
    const offset = offsets.get(edge.id) ?? 0;
    const cached = cache.get(edge);
    if (
      cached?.source === source &&
      cached.target === target &&
      cached.routing === routing &&
      cached.offset === offset
    ) {
      return [{ edge, route: cached.route }];
    }
    const route = routeDiagramEdge({
      source: resolveEnd(source, edge.sourcePort),
      target: resolveEnd(target, edge.targetPort),
      routing,
      offset,
    });
    cache.set(edge, { source, target, routing, offset, route });
    return [{ edge, route }];
  });
}

/** The edge from the port a connection starts at to the pointer, while it is dragged. */
function routePreview(controller: DiagramController, routing: DiagramEdgeRouting) {
  const connecting = controller.connect.connecting;
  const node = controller.nodes.find((item) => item.id === connecting?.node);
  if (!connecting?.pointer || !node) return null;
  const { x, y } = connecting.pointer;
  return routeDiagramEdge({
    source: resolveEnd(node, connecting.port),
    target: { rect: { x, y, width: 0, height: 0 } },
    routing,
  });
}

/**
 * The edges as SVG paths with arrowheads, in a layer under the nodes that spans them, and their
 * labels as positioned text above it.
 */
export function DiagramEdges({ controller, routing }: DiagramEdgesProps) {
  const { selection } = controller;
  const routed = useRoutedEdges(controller, routing);
  const preview = routePreview(controller, routing);
  const points = [...routed.map((item) => item.route.label), ...(preview ? [preview.label] : [])];
  const bounds = findDiagramBounds(
    [
      ...controller.nodes.map(resolveNodeRect),
      ...points.map((point) => ({ ...point, width: 0, height: 0 })),
    ],
    layerPadding,
  );
  if (!bounds) return null;
  const onSelect = (id: Key) => (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    selection.select(id, event.shiftKey || event.metaKey || event.ctrlKey);
  };
  return (
    <>
      <svg
        {...hooks.slot('edges')}
        aria-hidden="true"
        width={bounds.width}
        height={bounds.height}
        viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`}
        overflow="visible"
        style={{ position: 'absolute', left: bounds.x, top: bounds.y, pointerEvents: 'none' }}
      >
        {routed.map(({ edge, route }) => (
          <g
            key={toKeyIdentity(edge.id)}
            {...hooks.slot('edge', { selected: selection.selected.has(edge.id) })}
          >
            <path
              {...hooks.slot('edge-hit')}
              d={route.path}
              fill="none"
              style={{ pointerEvents: 'stroke' }}
              onPointerDown={onSelect(edge.id)}
            />
            <path {...hooks.slot('edge-path')} d={route.path} fill="none" />
            <path {...hooks.slot('edge-arrow')} d={route.arrow} />
          </g>
        ))}
        {preview ? (
          <path {...hooks.slot('connection-preview')} d={preview.path} fill="none" />
        ) : null}
      </svg>
      {routed.map(({ edge, route }) =>
        edge.label ? (
          <div
            key={toKeyIdentity(edge.id)}
            {...hooks.slot('edge-label', { selected: selection.selected.has(edge.id) })}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: route.label.x,
              top: route.label.y,
              transform: 'translate(-50%, -50%)',
            }}
            onPointerDown={onSelect(edge.id)}
          >
            {edge.label}
          </div>
        ) : null,
      )}
    </>
  );
}
