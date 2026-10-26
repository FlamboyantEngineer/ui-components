import { type FormEvent, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import type { StepsStatus } from '../steps/steps.js';
import type { WizardProps } from './wizard.js';
type NavigationOptions = Pick<WizardProps, 'steps' | 'currentId' | 'defaultCurrentId' | 'onCurrentIdChange' | 'onFinish'>;
/** The step a wizard shows and the moves the reader can make from it. */
export interface WizardNavigation {
    /** The position of the shown step. */
    index: number;
    /** Each step's status, in order. */
    statuses: StepsStatus[];
    /** While the shown step's check or the finish runs. */
    isPending: boolean;
    /** The shown step failed its check: its message, or `null` when it gave none. */
    failure: {
        message: string | null;
    } | null;
    /** The heading focus moves to after each move. */
    headingRef: RefObject<HTMLHeadingElement | null>;
    /** Runs the shown step's check, then moves to the next step or finishes. */
    submit: (event: FormEvent<HTMLFormElement>) => void;
    /** Moves to a step without checking the shown one. */
    goTo: (id: Key) => void;
    /** Passes over the shown step, marking it skipped. */
    skip: () => void;
}
/**
 * The navigation of a wizard: the shown step (controlled or not), the steps skipped on the way, the
 * pending check and its failure, and focus moving to the step's heading after each move.
 */
export declare function useWizardNavigation(options: NavigationOptions): WizardNavigation;
export {};
//# sourceMappingURL=wizard-navigation.d.ts.map