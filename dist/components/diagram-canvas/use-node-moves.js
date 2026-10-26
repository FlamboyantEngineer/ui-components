import { useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { snapToGrid, } from './diagram-model.js';
const largeStep = 5;
const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};
/** The positions of the nodes a move of `anchor` carries. */
function collectOrigins(nodes, { anchor, selected }) {
    const carried = selected.has(anchor) ? selected : new Set([anchor]);
    return new Map(nodes.filter((node) => carried.has(node.id)).map((node) => [node.id, { x: node.x, y: node.y }]));
}
/** Every origin shifted by the move that takes the anchor to its snapped target. */
function shiftOrigins(start, target, gridSize) {
    const origin = start.origins.get(start.anchor) ?? target;
    const shift = {
        x: snapToGrid(target.x, gridSize) - origin.x,
        y: snapToGrid(target.y, gridSize) - origin.y,
    };
    return new Map([...start.origins].map(([id, point]) => [id, { x: point.x + shift.x, y: point.y + shift.y }]));
}
/** Pointer drags, arrow-key steps and removal of nodes, applied through the change callbacks. */
export function useNodeMoves(options) {
    const strings = useUiStrings();
    const [preview, setPreview] = useState(null);
    const start = useRef(null);
    const { nodes, edges, selected, gridSize, announce } = options;
    const commit = (anchor, moved) => {
        const label = nodes.find((node) => node.id === anchor)?.label ?? '';
        options.onNodesChange?.(nodes.map((node) => (moved.has(node.id) ? { ...node, ...moved.get(node.id) } : node)));
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
            if (!active || !origin)
                return;
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
            if (!active || !moved || !at || (at.x === origin?.x && at.y === origin.y))
                return false;
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
            if (!origin)
                return;
            const distance = Math.max(1, gridSize) * (large ? largeStep : 1);
            const unit = directions[direction];
            const target = { x: origin.x + unit.x * distance, y: origin.y + unit.y * distance };
            commit(anchor, shiftOrigins(active, target, gridSize));
        },
        remove: (id) => {
            const keys = selected.has(id) ? selected : new Set([id]);
            const removedNodes = new Set(nodes.filter((node) => keys.has(node.id)).map((node) => node.id));
            const isRemovedEdge = (edge) => keys.has(edge.id) || removedNodes.has(edge.source) || removedNodes.has(edge.target);
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
//# sourceMappingURL=use-node-moves.js.map