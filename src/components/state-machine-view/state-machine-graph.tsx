'use client';

import { useMemo } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { layoutLayeredGraph } from '../../utils/layered-layout.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import {
  DiagramCanvas,
  type DiagramEdge,
  type DiagramNode,
} from '../diagram-canvas/diagram-canvas.js';

import { describeState } from './describe-state.js';
import type {
  StateMachineSequenceProps,
  StateMachineState,
  StateMachineViewProps,
} from './state-machine-view.js';
import { hooks } from './state-machine-view-hooks.js';

/** The graph presentation's props: everything but the sequence-only ones. */
type StateMachineGraphProps = Omit<
  StateMachineViewProps,
  'presentation' | keyof StateMachineSequenceProps
>;

const stateWidth = 144;
const stateHeight = 44;
// Room between layers for a transition's label.
const layerGap = 112;

// States and transitions share one diagram id space, so each id is namespaced by its kind and its
// typed identity: a transition `a` never collides with a state `a`, nor a state `1` with `'1'`.
const stateNodeId = (key: Key) => `state:${toKeyIdentity(key)}`;
const transitionEdgeId = (key: Key) => `transition:${toKeyIdentity(key)}`;

/** The states as diagram nodes, placed by the layered layout unless they carry a position. */
function useStateNodes(
  props: Pick<StateMachineGraphProps, 'states' | 'transitions' | 'orientation' | 'isEditing'> & {
    initial: Key | undefined;
    current: Key | undefined;
  },
): DiagramNode<StateMachineState>[] {
  const strings = useUiStrings();
  const { states, transitions, orientation = 'horizontal', isEditing, initial, current } = props;
  const positions = useMemo(() => {
    const ordered = [...states].sort((a, b) => Number(b.id === initial) - Number(a.id === initial));
    const layout = layoutLayeredGraph({
      nodes: ordered.map((state) => ({
        id: stateNodeId(state.id),
        width: stateWidth,
        height: stateHeight,
      })),
      edges: transitions.map((transition) => ({
        source: stateNodeId(transition.from),
        target: stateNodeId(transition.to),
      })),
      orientation,
      layerGap,
    });
    return new Map(layout.map((position) => [position.id, position]));
  }, [states, transitions, orientation, initial]);
  return states.map((state) => {
    const id = stateNodeId(state.id);
    const placed = positions.get(id);
    return {
      id,
      x: state.x ?? placed?.x ?? 0,
      y: state.y ?? placed?.y ?? 0,
      width: stateWidth,
      height: stateHeight,
      label: state.label,
      description: describeState(state, { initial, current, withCount: false }, strings),
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
export function StateMachineGraph({
  states,
  transitions,
  initialState,
  currentKey,
  orientation = 'horizontal',
  isEditing = false,
  onStatesChange,
  onTransitionsChange,
  onTransitionAdd,
  defaultView,
  'aria-label': ariaLabel,
  className,
  ...rest
}: StateMachineGraphProps) {
  const strings = useUiStrings();
  const initial = initialState ?? states[0]?.id;
  const nodes = useStateNodes({
    states,
    transitions,
    orientation,
    isEditing,
    initial,
    current: currentKey,
  });
  const edges: DiagramEdge[] = transitions.map(({ id, from, to, label }) => ({
    id: transitionEdgeId(id),
    source: stateNodeId(from),
    target: stateNodeId(to),
    label,
  }));
  const stateOf = (nodeId: Key) => states.find((state) => stateNodeId(state.id) === nodeId);
  return (
    <DiagramCanvas<StateMachineState>
      {...rest}
      {...hooks.root({ className, props: rest, data: { orientation, presentation: 'graph' } })}
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.stateMachine)}
      nodes={nodes}
      edges={edges}
      isEditing={isEditing}
      showMinimap={false}
      defaultView={defaultView}
      renderNode={(node) => (
        <div
          {...hooks.slot('state', {
            current: node.data?.id === currentKey,
            initial: node.data?.id === initial,
            final: node.data?.isFinal ?? false,
            status: node.data?.status,
            tone: node.data?.tone,
          })}
        >
          {node.data?.id === initial ? (
            <span {...hooks.slot('initial-marker')} aria-hidden="true" />
          ) : null}
          <span {...hooks.slot('state-label')}>{node.label}</span>
        </div>
      )}
      onNodesChange={(next) =>
        onStatesChange?.(
          next.flatMap((node) => (node.data ? [{ ...node.data, x: node.x, y: node.y }] : [])),
        )
      }
      onEdgesChange={(next) => {
        const kept = new Set(next.map((edge) => edge.id));
        onTransitionsChange?.(
          transitions.filter((transition) => kept.has(transitionEdgeId(transition.id))),
        );
      }}
      onConnect={(connection) => {
        const from = stateOf(connection.source);
        const to = stateOf(connection.target);
        if (from && to) onTransitionAdd?.({ from: from.id, to: to.id });
      }}
    />
  );
}
