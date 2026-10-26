import { useCallback, useMemo, useState } from 'react';
import { indexDiagramLinks } from './diagram-links.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { findDiagramBounds, resolveNodeRect, toDiagramPoint, } from './diagram-model.js';
import { useDiagramConnect, } from './use-diagram-connect.js';
import { useDiagramSelection } from './use-diagram-selection.js';
import { useDiagramViewport } from './use-diagram-viewport.js';
import { useNodeMoves } from './use-node-moves.js';
function applyPreview(nodes, preview) {
    if (!preview)
        return nodes;
    return nodes.map((node) => (preview.has(node.id) ? { ...node, ...preview.get(node.id) } : node));
}
/** Element lookups for nodes and ports, kept by ref callbacks; the same functions every render. */
function createTargetRegistry() {
    const targets = new Map();
    return {
        registerTarget: (target) => (element) => {
            if (!element)
                return undefined;
            targets.set(element, target);
            return () => {
                targets.delete(element);
            };
        },
        focusNode: (id) => {
            for (const [element, target] of targets) {
                if (target.node === id && target.port === undefined)
                    element.focus();
            }
        },
        findTarget: (clientX, clientY) => {
            const hit = document.elementFromPoint(clientX, clientY);
            const element = hit?.closest(`.${hooks.slotClass('port')}, .${hooks.slotClass('node')}`);
            return (element && targets.get(element)) ?? null;
        },
    };
}
/** The live region's text, renewed by each announcement even when the text repeats. */
function useAnnouncer() {
    const [message, setMessage] = useState({ text: '', id: 0 });
    const announce = useCallback((text) => setMessage((current) => ({ text, id: current.id + 1 })), []);
    return [message, announce];
}
/** The state and services of one diagram canvas. */
export function useDiagramController(options) {
    const { edges, isEditing } = options;
    const links = useMemo(() => indexDiagramLinks(options.nodes, edges), [options.nodes, edges]);
    const [message, announce] = useAnnouncer();
    const [viewportElement, setViewportElement] = useState(null);
    const bounds = useMemo(() => findDiagramBounds(options.nodes.map(resolveNodeRect)), [options.nodes]);
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
    const toDiagram = (clientX, clientY) => {
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
//# sourceMappingURL=use-diagram-controller.js.map