'use client';

import type { MouseEvent, ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Density, Key, Orientation, RefProps } from '../../core/props.js';
import type { DiagramView } from '../diagram-canvas/diagram-canvas.js';
import { StateMachineGraph } from './state-machine-graph.js';
import { StateMachineSequence } from './state-machine-sequence.js';

export type StateMachineViewPresentation = 'graph' | 'sequence';
export type StateMachineViewDensity = Extract<Density, 'default' | 'compact'>;

export interface StateMachineViewSequenceGeometry {
  /** Minimum distance between transition lanes. Defaults to 26. */
  lanePitch?: number | undefined;
  /** Distance between state segments. Defaults to 0. */
  stateGap?: number | undefined;
  /** Clearance between the row and the nearest label. Defaults to 15. */
  rowSpacer?: number | undefined;
  /** Equal route corner radius, capped by clearance. Defaults to 10. */
  cornerRadius?: number | undefined;
}

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

export interface StateMachineViewProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** Graph canvas by default; sequence keeps caller order in a horizontal row. */
  presentation?: StateMachineViewPresentation | undefined;
  /** Sequence geometry density. Defaults to `default`. */
  density?: StateMachineViewDensity | undefined;
  /** Optional sequence distances in CSS pixels; omitted values use the documented defaults. */
  sequenceGeometry?: StateMachineViewSequenceGeometry | undefined;
  /** The host-selected sequence state, independent of the current machine state. */
  selectedKey?: Key | null | undefined;
  /** Called when a sequence state is selected. */
  onSelectionChange?: ((key: Key) => void) | undefined;
  /** The transition highlighted by the host in sequence mode. */
  activeTransitionKey?: Key | null | undefined;
  /** Called when a named sequence transition label is activated. */
  onTransitionAction?: ((key: Key) => void) | undefined;
  /** A context menu request on a named sequence transition label. */
  onTransitionContextMenu?: ((key: Key, event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  /** Non-interactive label content for a named sequence transition. */
  renderTransitionLabel?: ((transition: StateMachineTransition) => ReactNode) | undefined;
  /** Optional hint on the sequence transition label alone. */
  getTransitionTooltip?: ((transition: StateMachineTransition) => ReactNode) | undefined;
  states: readonly StateMachineState[];
  transitions: readonly StateMachineTransition[];
  /** The state the machine starts in. Defaults to the first state. */
  initialState?: Key | undefined;
  /** The state the machine is in, highlighted. */
  currentKey?: Key | undefined;
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

/** A graph canvas, or an ordered horizontal sequence with independently actionable labels. */
export function StateMachineView(props: StateMachineViewProps) {
  const {
    presentation,
    density,
    sequenceGeometry,
    selectedKey,
    onSelectionChange,
    activeTransitionKey,
    onTransitionAction,
    onTransitionContextMenu,
    renderTransitionLabel,
    getTransitionTooltip,
    ...graph
  } = props;
  const sequence = {
    density,
    sequenceGeometry,
    selectedKey,
    onSelectionChange,
    activeTransitionKey,
    onTransitionAction,
    onTransitionContextMenu,
    renderTransitionLabel,
    getTransitionTooltip,
  };
  return presentation === 'sequence' ? (
    <StateMachineSequence {...graph} {...sequence} />
  ) : (
    <StateMachineGraph {...graph} />
  );
}
