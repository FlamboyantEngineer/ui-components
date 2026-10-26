import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { layoutLayeredGraph } from '../../utils/layered-layout.js';
import { DiagramCanvas, } from '../diagram-canvas/diagram-canvas.js';
const hooks = createHooks('state-machine-view', ['state', 'state-label', 'initial-marker']);
const stateWidth = 144;
const stateHeight = 44;
// Room between layers for a transition's label.
const layerGap = 112;
function describeState(state, flags, strings) {
    return [
        flags.isCurrent ? strings.stateMachineCurrent : '',
        flags.isInitial ? strings.stateMachineInitial : '',
        state.isFinal ? strings.stateMachineFinal : '',
    ]
        .filter(Boolean)
        .join(' ');
}
/** The states as diagram nodes, placed by the layered layout unless they carry a position. */
function useStateNodes(props) {
    const strings = useUiStrings();
    const { states, transitions, orientation = 'horizontal', isEditing, initial, current } = props;
    const positions = useMemo(() => {
        const ordered = [...states].sort((a, b) => Number(b.id === initial) - Number(a.id === initial));
        const layout = layoutLayeredGraph({
            nodes: ordered.map((state) => ({ id: state.id, width: stateWidth, height: stateHeight })),
            edges: transitions.map((transition) => ({ source: transition.from, target: transition.to })),
            orientation,
            layerGap,
        });
        return new Map(layout.map((position) => [position.id, position]));
    }, [states, transitions, orientation, initial]);
    return states.map((state) => {
        const placed = positions.get(state.id);
        const flags = { isCurrent: state.id === current, isInitial: state.id === initial };
        return {
            id: state.id,
            x: state.x ?? placed?.x ?? 0,
            y: state.y ?? placed?.y ?? 0,
            width: stateWidth,
            height: stateHeight,
            label: state.label,
            description: describeState(state, flags, strings),
            ports: isEditing
                ? [
                    {
                        id: 'next',
                        side: orientation === 'vertical' ? 'bottom' : 'right',
                        label: strings.stateMachineAddTransition,
                    },
                ]
                : undefined,
            data: state,
        };
    });
}
/**
 * A state machine drawn as a diagram: states laid out in layers from the initial state, joined by
 * labelled transitions, with initial and final markers and the current state highlighted. It is
 * read only unless `isEditing`, which lets the reader move and remove states and add and remove
 * transitions, each change reaching the caller as plain data.
 */
export function StateMachineView({ states, transitions, initialState, currentState, orientation = 'horizontal', isEditing = false, onStatesChange, onTransitionsChange, onTransitionAdd, defaultView, 'aria-label': ariaLabel, className, ...rest }) {
    const strings = useUiStrings();
    const initial = initialState ?? states[0]?.id;
    const nodes = useStateNodes({
        states,
        transitions,
        orientation,
        isEditing,
        initial,
        current: currentState,
    });
    const edges = transitions.map(({ id, from, to, label }) => ({
        id,
        source: from,
        target: to,
        label,
    }));
    return (_jsx(DiagramCanvas, { ...rest, ...hooks.root({ className, props: rest, data: { orientation } }), "aria-label": ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.stateMachine), nodes: nodes, edges: edges, isEditing: isEditing, showMinimap: false, defaultView: defaultView, renderNode: (node) => (_jsxs("div", { ...hooks.slot('state', {
                current: node.id === currentState,
                initial: node.id === initial,
                final: node.data?.isFinal ?? false,
            }), children: [node.id === initial ? (_jsx("span", { ...hooks.slot('initial-marker'), "aria-hidden": "true" })) : null, _jsx("span", { ...hooks.slot('state-label'), children: node.label })] })), onNodesChange: (next) => onStatesChange?.(next.flatMap((node) => (node.data ? [{ ...node.data, x: node.x, y: node.y }] : []))), onEdgesChange: (next) => {
            const kept = new Set(next.map((edge) => edge.id));
            onTransitionsChange?.(transitions.filter((transition) => kept.has(transition.id)));
        }, onConnect: (connection) => onTransitionAdd?.({ from: connection.source, to: connection.target }) }));
}
//# sourceMappingURL=state-machine-view.js.map