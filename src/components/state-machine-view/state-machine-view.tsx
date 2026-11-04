'use client';

import type { ReactNode } from 'react';
import type { AriaLabellingProps, PointerType, PressEvent } from '../../core/events.js';
import type {
  BaseProps,
  Density,
  Key,
  Orientation,
  RefProps,
  Size,
  Tone,
} from '../../core/props.js';
import type { MenuAnchor } from '../context-menu/context-menu.js';
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
  /** A sequence state that cannot be focused, selected or activated. */
  isDisabled?: boolean | undefined;
  /** The host's own status name, such as `pending` or `blocked`, published in `data-status`. */
  status?: string | undefined;
  /** The status's tone, published in `data-tone`. */
  tone?: Tone | undefined;
  /** Read after the machine status in the state's description, in both presentations. */
  description?: string | undefined;
  /** A structural count after the label in sequence mode, shown exactly, zero included. */
  count?: number | undefined;
  /** A notification count, shown in sequence mode only when positive and capped at 9+; `count` wins. */
  notificationCount?: number | undefined;
  /** What the shown count is read as. Defaults to the provider's `itemCount` with the exact count. */
  countLabel?: string | undefined;
}

export interface StateMachineTransition {
  id: Key;
  from: Key;
  to: Key;
  /** The event or action that takes the machine from one state to the other. */
  label?: string | undefined;
  /** The sequence label's accessible description, such as its endpoints, rules and actions. */
  description?: string | undefined;
}

/** A transition the reader asks for in edit mode; the caller gives it an id and a label. */
export interface StateMachineTransitionRequest {
  from: Key;
  to: Key;
}

/** A context menu request on a sequence state, transition label or the background. */
export interface StateMachineContextMenuEvent {
  /** Where a menu opens: the pointer's viewport point, or the target element from the keyboard. */
  anchor: MenuAnchor;
  /** The state button, transition label, empty note or viewport the request reached. */
  target: HTMLElement;
  pointerType: PointerType;
  /** Keeps the browser's own menu closed; call it when the host opens a menu of its own. */
  preventDefault(): void;
  readonly defaultPrevented: boolean;
}

/** Where a sequence state's tooltip opens. */
export type StateMachineTooltipPlacement = 'top' | 'bottom';

/** Props that apply to the sequence presentation only. */
export interface StateMachineSequenceProps {
  /** Sequence state size, from `xs` through `xl`. Defaults to `md`. */
  size?: Size | undefined;
  /** Sequence geometry density. Defaults to `default`. */
  density?: StateMachineViewDensity | undefined;
  /** Optional sequence distances in CSS pixels; omitted values use the documented defaults. */
  sequenceGeometry?: StateMachineViewSequenceGeometry | undefined;
  /** The host-selected state, independent of the current machine state; `null` selects none. */
  selectedKey?: Key | null | undefined;
  /** Asks the host to select a state, or none when the selected state is removed or disabled. */
  onSelectionChange?: ((key: Key | null) => void) | undefined;
  /** The host-selected transition; `null` selects none. */
  selectedTransitionKey?: Key | null | undefined;
  /** Asks the host to select a transition, or none when the selected transition is gone. */
  onTransitionSelectionChange?: ((key: Key | null) => void) | undefined;
  /** Every press, Enter or Space on an enabled state, selected or current ones included. */
  onStateAction?: ((key: Key, state: StateMachineState, event: PressEvent) => void) | undefined;
  /** Every press, Enter or Space on a named transition label. */
  onTransitionAction?:
    ((key: Key, transition: StateMachineTransition, event: PressEvent) => void) | undefined;
  /** A context menu request on a state, by secondary click, the Context Menu key or Shift+F10. */
  onStateContextMenu?:
    ((key: Key, state: StateMachineState, event: StateMachineContextMenuEvent) => void) | undefined;
  /** A context menu request on a named transition label. */
  onTransitionContextMenu?:
    | ((key: Key, transition: StateMachineTransition, event: StateMachineContextMenuEvent) => void)
    | undefined;
  /** A context menu request on the background or the empty note, never on a state or label. */
  onBackgroundContextMenu?: ((event: StateMachineContextMenuEvent) => void) | undefined;
  /** Decorative content before a state's label, such as a status icon. */
  renderStateAdornment?: ((state: StateMachineState) => ReactNode) | undefined;
  /** A hint on a state, which describes it while open. */
  getStateTooltip?: ((state: StateMachineState) => ReactNode) | undefined;
  /** Where state hints open. Defaults to `top`; `bottom` suits a row in toolbar chrome. */
  stateTooltipPlacement?: StateMachineTooltipPlacement | undefined;
  /** Non-interactive label content for a named sequence transition. */
  renderTransitionLabel?: ((transition: StateMachineTransition) => ReactNode) | undefined;
  /** A hint on a transition label alone, which describes it while open. */
  getTransitionTooltip?: ((transition: StateMachineTransition) => ReactNode) | undefined;
  /** Content of the focusable note shown while there are no states. */
  renderEmptyState?: (() => ReactNode) | undefined;
  /** The empty note's accessible name. Defaults to the provider's `stateMachineEmpty`. */
  emptyLabel?: string | undefined;
}

export interface StateMachineViewProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement>, StateMachineSequenceProps {
  /** Graph canvas by default; sequence keeps caller order in a horizontal row. */
  presentation?: StateMachineViewPresentation | undefined;
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
export function StateMachineView({ presentation, ...props }: StateMachineViewProps) {
  if (presentation === 'sequence') return <StateMachineSequence {...props} />;
  const {
    size: _size,
    density: _density,
    sequenceGeometry: _sequenceGeometry,
    selectedKey: _selectedKey,
    onSelectionChange: _onSelectionChange,
    selectedTransitionKey: _selectedTransitionKey,
    onTransitionSelectionChange: _onTransitionSelectionChange,
    onStateAction: _onStateAction,
    onTransitionAction: _onTransitionAction,
    onStateContextMenu: _onStateContextMenu,
    onTransitionContextMenu: _onTransitionContextMenu,
    onBackgroundContextMenu: _onBackgroundContextMenu,
    renderStateAdornment: _renderStateAdornment,
    getStateTooltip: _getStateTooltip,
    stateTooltipPlacement: _stateTooltipPlacement,
    renderTransitionLabel: _renderTransitionLabel,
    getTransitionTooltip: _getTransitionTooltip,
    renderEmptyState: _renderEmptyState,
    emptyLabel: _emptyLabel,
    ...graph
  } = props;
  return <StateMachineGraph {...graph} />;
}
