import { useMemo } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Orientation } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { layoutLayeredGraph } from '../../utils/layered-layout.js';
import {
  DiagramCanvas,
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
} from '../diagram-canvas/diagram-canvas.js';

export interface StateMachineState {
  id: Key;
  label: string;
  /** Marks a state the machine ends in. */
  isFinal?: boolean | undefined;
  /** A position the reader gave the state in edit mode; without it the layout places the state. */
  x?: number | undefined;
  y?: number | undefined;
}

export interface StateMachineTransition {
  id: Key;
  from: Key;
  to: Key;
  /** The event or action that takes the machine from one state to the other. */
  label?: string | undefined;
}

/** A transition the reader asks for in edit mode; the caller gives it an id and a label. */
export interface StateMachineTransitionRequest {
  from: Key;
  to: Key;
}

export interface StateMachineViewProps extends BaseProps, AriaLabellingProps {
  states: readonly StateMachineState[];
  transitions: readonly StateMachineTransition[];
  /** The state the machine starts in. Defaults to the first state. */
  initialState?: Key | undefined;
  /** The state the machine is in, highlighted. */
  currentState?: Key | undefined;
  /** `horizontal` (the default) lays the states out left to right; `vertical` top to bottom. */
  orientation?: Orientation | undefined;
  /** Lets the reader move and remove states, add transitions and remove them. */
  isEditing?: boolean | undefined;
  /** Called with every state, positioned where it is drawn, after a move or removal. */
  onStatesChange?: ((states: StateMachineState[]) => void) | undefined;
  /** Called with the transitions left after a removal. */
  onTransitionsChange?: ((transitions: StateMachineTransition[]) => void) | undefined;
  /** Called when the reader connects one state to another. */
  onTransitionAdd?: ((transition: StateMachineTransitionRequest) => void) | undefined;
  /** The view shown at first: the diagram or its outline. Defaults to `canvas`. */
  defaultView?: DiagramView | undefined;
}

interface StateFlags {
  isCurrent: boolean;
  isInitial: boolean;
}

const hooks = createHooks('state-machine-view', ['state', 'state-label', 'initial-marker']);
const stateWidth = 144;
const stateHeight = 44;
// Room between layers for a transition's label.
const layerGap = 112;

function describeState(state: StateMachineState, flags: StateFlags, strings: UiStrings): string {
  return [
    flags.isCurrent ? strings.stateMachineCurrent : '',
    flags.isInitial ? strings.stateMachineInitial : '',
    state.isFinal ? strings.stateMachineFinal : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/** The states as diagram nodes, placed by the layered layout unless they carry a position. */
function useStateNodes(
  props: Pick<StateMachineViewProps, 'states' | 'transitions' | 'orientation' | 'isEditing'> & {
    initial: Key | undefined;
    current: Key | undefined;
  },
): DiagramNode<StateMachineState>[] {
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
export function StateMachineView({
  states,
  transitions,
  initialState,
  currentState,
  orientation = 'horizontal',
  isEditing = false,
  onStatesChange,
  onTransitionsChange,
  onTransitionAdd,
  defaultView,
  'aria-label': ariaLabel,
  className,
  ...rest
}: StateMachineViewProps) {
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
  const edges: DiagramEdge[] = transitions.map(({ id, from, to, label }) => ({
    id,
    source: from,
    target: to,
    label,
  }));
  return (
    <DiagramCanvas<StateMachineState>
      {...rest}
      {...hooks.root({ className, props: rest, data: { orientation } })}
      aria-label={ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.stateMachine)}
      nodes={nodes}
      edges={edges}
      isEditing={isEditing}
      showMinimap={false}
      defaultView={defaultView}
      renderNode={(node) => (
        <div
          {...hooks.slot('state', {
            current: node.id === currentState,
            initial: node.id === initial,
            final: node.data?.isFinal ?? false,
          })}
        >
          {node.id === initial ? (
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
        onTransitionsChange?.(transitions.filter((transition) => kept.has(transition.id)));
      }}
      onConnect={(connection) =>
        onTransitionAdd?.({ from: connection.source, to: connection.target })
      }
    />
  );
}
