import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { findDiagramBounds, resolveNodeRect, spreadParallelEdges, } from './diagram-model.js';
import { routeDiagramEdge, } from './edge-route.js';
const layerPadding = 96;
function resolveEnd(node, portId) {
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
function useRoutedEdges(controller, routing) {
    const [cache] = useState(() => new WeakMap());
    const offsets = useMemo(() => spreadParallelEdges(controller.edges), [controller.edges]);
    const byId = new Map(controller.nodes.map((node) => [node.id, node]));
    return controller.edges.flatMap((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target)
            return [];
        const offset = offsets.get(edge.id) ?? 0;
        const cached = cache.get(edge);
        if (cached?.source === source &&
            cached.target === target &&
            cached.routing === routing &&
            cached.offset === offset) {
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
function routePreview(controller, routing) {
    const connecting = controller.connect.connecting;
    const node = controller.nodes.find((item) => item.id === connecting?.node);
    if (!connecting?.pointer || !node)
        return null;
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
export function DiagramEdges({ controller, routing }) {
    const { selection } = controller;
    const routed = useRoutedEdges(controller, routing);
    const preview = routePreview(controller, routing);
    const points = [...routed.map((item) => item.route.label), ...(preview ? [preview.label] : [])];
    const bounds = findDiagramBounds([
        ...controller.nodes.map(resolveNodeRect),
        ...points.map((point) => ({ ...point, width: 0, height: 0 })),
    ], layerPadding);
    if (!bounds)
        return null;
    const onSelect = (id) => (event) => {
        if (event.button !== 0)
            return;
        event.stopPropagation();
        selection.select(id, event.shiftKey || event.metaKey || event.ctrlKey);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("svg", { ...hooks.slot('edges'), "aria-hidden": "true", width: bounds.width, height: bounds.height, viewBox: `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`, overflow: "visible", style: { position: 'absolute', left: bounds.x, top: bounds.y, pointerEvents: 'none' }, children: [routed.map(({ edge, route }) => (_jsxs("g", { ...hooks.slot('edge', { selected: selection.selected.has(edge.id) }), children: [_jsx("path", { ...hooks.slot('edge-hit'), d: route.path, fill: "none", style: { pointerEvents: 'stroke' }, onPointerDown: onSelect(edge.id) }), _jsx("path", { ...hooks.slot('edge-path'), d: route.path, fill: "none" }), _jsx("path", { ...hooks.slot('edge-arrow'), d: route.arrow })] }, toKeyIdentity(edge.id)))), preview ? (_jsx("path", { ...hooks.slot('connection-preview'), d: preview.path, fill: "none" })) : null] }), routed.map(({ edge, route }) => edge.label ? (_jsx("div", { ...hooks.slot('edge-label', { selected: selection.selected.has(edge.id) }), "aria-hidden": "true", style: {
                    position: 'absolute',
                    left: route.label.x,
                    top: route.label.y,
                    transform: 'translate(-50%, -50%)',
                }, onPointerDown: onSelect(edge.id), children: edge.label }, toKeyIdentity(edge.id))) : null)] }));
}
//# sourceMappingURL=diagram-edges.js.map