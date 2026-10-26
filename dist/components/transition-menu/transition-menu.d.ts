import { type ReactNode } from 'react';
import type { BaseProps, Key, Tone } from '../../core/props.js';
/** One state a record can be in. */
export interface TransitionMenuState {
    /** Identifies the state. */
    id: Key;
    /** The state's name. */
    label: string;
    /** The state's tone. Defaults to `neutral`. */
    tone?: Tone | undefined;
}
/** A move from the current state to another. */
export interface TransitionMenuTransition {
    /** Identifies the transition. */
    id: Key;
    /** The `id` of the state it leads to. */
    to: Key;
    /** The action's name. Defaults to the target state's label. */
    label?: string | undefined;
    /** What the transition does, under its name. */
    description?: string | undefined;
    /** Why the transition is unavailable: it shows disabled but focusable, with this under its name. */
    disabledReason?: string | undefined;
    /** Asks for confirmation first, in a dialog with this message. */
    confirmMessage?: ReactNode;
    /** Asks for a comment first, in a dialog that refuses a blank one. */
    requiresComment?: boolean | undefined;
}
/** A transition the reader chose. */
export interface TransitionMenuChange {
    /** The transition's `id`. */
    transition: Key;
    /** The `id` of the state it leads to. */
    to: Key;
    /** The comment, when the transition requires one. */
    comment?: string | undefined;
}
export interface TransitionMenuProps extends BaseProps {
    /** Every state, to name and colour the current one and the targets. */
    states: readonly TransitionMenuState[];
    /** The `id` of the current state. */
    value: Key;
    /** The transitions allowed from the current state, in order. Without any, the state only shows. */
    transitions: readonly TransitionMenuTransition[];
    /** Runs a transition. A returned promise keeps the trigger, or the dialog, pending until it settles. */
    onTransition: (change: TransitionMenuChange) => void | Promise<unknown>;
    /** Names what the state is, as in "Status: Open". Defaults to the provider's `status` string. */
    label?: string | undefined;
    /** Refuses every transition. */
    isDisabled?: boolean | undefined;
}
/**
 * A record's current state as a badge that opens a menu of the states it may move to: each allowed
 * transition with its target's tone, a description, or the reason it is unavailable. A transition
 * may ask for confirmation or a required comment in a dialog before it runs.
 */
export declare function TransitionMenu({ states, value, transitions, onTransition, label, isDisabled, className, id, ...rest }: TransitionMenuProps): import("react").JSX.Element;
//# sourceMappingURL=transition-menu.d.ts.map