import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { isEditableTarget } from '../../utils/is-editable-target.js';
import { mergeProps, mergeRefs } from '../../utils/merge-props.js';
import { useLatest } from '../../utils/use-latest.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { DiagramEdges } from './diagram-edges.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
import { DiagramMinimap } from './diagram-minimap.js';
import { DiagramNodeView } from './diagram-node.js';
import { formatDiagramLink } from './diagram-links.js';
import { DiagramOutline } from './diagram-outline.js';
import { DiagramPaletteContext, useCanvasPalette, usePaletteDrop, } from './diagram-palette.js';
import { DiagramToolbar } from './diagram-toolbar.js';
import { useBackgroundPointer } from './use-background-pointer.js';
import { useDiagramController, } from './use-diagram-controller.js';
export { DiagramPaletteItem } from './diagram-palette.js';
export { routeDiagramEdge, } from './edge-route.js';
/** Each node's description: the labels of the nodes it leads to and comes from. */
function describeLinks(links, strings) {
    const descriptions = new Map();
    for (const [id, { outgoing, incoming }] of links) {
        const parts = [
            outgoing.length > 0
                ? strings.diagramOutgoing(outgoing.map(formatDiagramLink).join(', '))
                : '',
            incoming.length > 0
                ? strings.diagramIncoming(incoming.map(formatDiagramLink).join(', '))
                : '',
        ];
        descriptions.set(id, parts.filter(Boolean).join(' '));
    }
    return descriptions;
}
/** The nodes, each rendered again only when its own state changes. */
function DiagramNodes({ controller, renderNode, }) {
    const strings = useUiStrings();
    // The nodes read the latest controller only when the reader acts.
    const latest = useLatest(controller);
    const descriptions = useMemo(() => describeLinks(controller.links, strings), [controller.links, strings]);
    const { selection, moves, connect } = controller;
    return controller.nodes.map((node) => (_jsx(DiagramNodeView, { node: node, controller: latest, registerTarget: controller.registerTarget, isSelected: selection.selected.has(node.id), isEditing: controller.isEditing, isMoving: moves.preview?.has(node.id) ?? false, connectPort: connect.connecting?.node === node.id ? connect.connecting.port : null, description: descriptions.get(node.id) ?? '', renderNode: renderNode }, toKeyIdentity(node.id))));
}
/** The visually hidden live region; each announcement replaces its text node, so it is read. */
function DiagramStatus({ message }) {
    return (_jsx(VisuallyHidden, { children: _jsx("div", { ...hooks.slot('status'), role: "status", children: message.id > 0 ? _jsx("span", { children: message.text }, message.id) : null }) }));
}
/** The pannable, zoomable surface: edges, nodes, the marquee and the minimap. */
function DiagramViewportArea({ controller, palette, routing, renderNode, selectionMode, showMinimap, }) {
    const strings = useUiStrings();
    const ref = useRef(null);
    const { viewport, stepZoom } = controller.view;
    const { marquee, pointerProps } = useBackgroundPointer(controller, selectionMode);
    const { dropProps, isDropTarget } = usePaletteDrop({ ref, palette });
    const onKeyDown = (event) => {
        if (isEditableTarget(event.target, '[role="slider"]'))
            return;
        if (event.altKey || event.ctrlKey || event.metaKey)
            return;
        if (event.key === '+' || event.key === '=')
            stepZoom(1);
        else if (event.key === '-')
            stepZoom(-1);
        else
            return;
        event.preventDefault();
    };
    // The viewport takes focus, without joining the Tab order, when the last node is removed.
    return (_jsxs("div", { ...hooks.slot('viewport', { dropTarget: isDropTarget }), ref: mergeRefs(ref, controller.setViewportElement), tabIndex: -1, style: { position: 'relative', touchAction: 'none' }, ...mergeProps(dropProps, pointerProps, {
            onKeyDown,
            // Focusing a node scrolls its clipped container; the view pans with its transform instead.
            onScroll: (event) => event.currentTarget.scrollTo(0, 0),
        }), children: [_jsxs("div", { ...hooks.slot('content'), style: {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transformOrigin: '0 0',
                    transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom / 100})`,
                }, children: [_jsx(DiagramEdges, { controller: controller, routing: routing }), _jsx(DiagramNodes, { controller: controller, renderNode: renderNode })] }), controller.nodes.length === 0 ? (_jsx("p", { ...hooks.slot('empty'), children: strings.diagramEmpty })) : null, marquee ? (_jsx("div", { ...hooks.slot('marquee'), style: {
                    position: 'absolute',
                    left: marquee.x,
                    top: marquee.y,
                    width: marquee.width,
                    height: marquee.height,
                } })) : null, showMinimap ? _jsx(DiagramMinimap, { controller: controller }) : null] }));
}
/**
 * A pannable, zoomable diagram of nodes the caller renders, joined by edges drawn as SVG paths
 * between their ports. Nodes are named, focusable groups: the reader selects them by click,
 * Shift-click, marquee or Space, moves between connected nodes with the arrow keys and, in edit
 * mode, moves nodes by drag or arrow keys on a grid, connects ports by drag or by keyboard, adds
 * nodes from a palette and removes them. The data is the caller's: every change arrives through a
 * callback as plain data. An outline view lists the nodes and their links.
 */
export function DiagramCanvas({ nodes, edges, renderNode, routing = 'bezier', isEditing = false, gridSize = 10, selectionMode = 'multiple', selectedKeys, defaultSelectedKeys, onSelectionChange, viewport: viewportProp, defaultViewport, onViewportChange, view: viewProp, defaultView = 'canvas', onViewChange, onNodesChange, onEdgesChange, onConnect, onNodeAdd, palette: paletteContent, showMinimap = true, 'aria-label': ariaLabel, className, ...rest }) {
    const strings = useUiStrings();
    const [view, setView] = useControllableState(viewProp, defaultView, onViewChange);
    const controller = useDiagramController({
        ...{ nodes, edges, isEditing, gridSize, selectionMode, selectedKeys, defaultSelectedKeys },
        ...{
            onSelectionChange,
            viewport: viewportProp,
            defaultViewport,
            onViewportChange,
            onEdgesChange,
            onConnect,
        },
        onNodesChange: onNodesChange,
    });
    const palette = useCanvasPalette({ controller, gridSize, onNodeAdd });
    const area = { routing, renderNode, selectionMode, showMinimap };
    return (_jsxs("div", { ...rest, ...hooks.root({
            className,
            props: rest,
            data: {
                view,
                routing,
                editing: isEditing,
                connecting: controller.connect.connecting !== null,
            },
        }), role: "group", "aria-label": ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.diagram), children: [_jsxs(DiagramPaletteContext.Provider, { value: palette, children: [_jsx(DiagramToolbar, { controller: controller, view: view, onViewChange: setView }), paletteContent ? (_jsx("div", { ...hooks.slot('palette'), role: "group", "aria-label": strings.diagramPalette, children: paletteContent })) : null, view === 'canvas' ? (_jsx(DiagramViewportArea, { ...area, controller: controller, palette: palette })) : (_jsx(DiagramOutline, { controller: controller }))] }), _jsx(DiagramStatus, { message: controller.message })] }));
}
//# sourceMappingURL=diagram-canvas.js.map