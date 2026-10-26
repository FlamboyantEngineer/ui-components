import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Orientation } from '../../core/props.js';
import { type DiagramView } from '../diagram-canvas/diagram-canvas.js';
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
/**
 * A state machine drawn as a diagram: states laid out in layers from the initial state, joined by
 * labelled transitions, with initial and final markers and the current state highlighted. It is
 * read only unless `isEditing`, which lets the reader move and remove states and add and remove
 * transitions, each change reaching the caller as plain data.
 */
export declare function StateMachineView({ states, transitions, initialState, currentState, orientation, isEditing, onStatesChange, onTransitionsChange, onTransitionAdd, defaultView, 'aria-label': ariaLabel, className, ...rest }: StateMachineViewProps): import("react").JSX.Element;
//# sourceMappingURL=state-machine-view.d.ts.map