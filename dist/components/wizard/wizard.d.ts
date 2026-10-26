import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, Orientation } from '../../core/props.js';
import { type HeadingLevel } from '../section-header/section-header.js';
/** What a step's check answers: `false` or a message keeps the reader on the step. */
export type WizardValidation = boolean | string | void;
export interface WizardStep {
    /** Identifies the step. */
    id: Key;
    /** The step's name, in the list of steps and as its panel's heading. */
    label: ReactNode;
    /** A line under the label in the list of steps. */
    description?: ReactNode;
    /** The step's panel: its fields and content. */
    content: ReactNode;
    /** The reader may pass over the step with Skip. */
    isOptional?: boolean | undefined;
    /**
     * Checks the step once its fields pass, before the wizard moves on. Return `false` or a message to
     * stay; a returned promise keeps Next pending until it settles.
     */
    validate?: (() => WizardValidation | Promise<WizardValidation>) | undefined;
}
export interface WizardProps extends BaseProps, AriaLabellingProps {
    /** The steps, in order. */
    steps: readonly WizardStep[];
    /** The shown step, controlled. */
    currentId?: Key | undefined;
    /** The step shown first, uncontrolled. Defaults to the first step. */
    defaultCurrentId?: Key | undefined;
    /** Receives the step the wizard moves to. */
    onCurrentIdChange?: ((id: Key) => void) | undefined;
    /** Runs when the last step passes; a returned promise keeps Finish pending until it settles. */
    onFinish?: (() => void | Promise<unknown>) | undefined;
    /** Draws a Cancel button that calls it. */
    onCancel?: (() => void) | undefined;
    /** The last step's button. Defaults to the provider's `finish` string. */
    finishLabel?: ReactNode;
    /** How the list of steps runs: above the panel, or beside it. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** The level of each panel's heading. Defaults to one below the enclosing section, else 3. */
    headingLevel?: HeadingLevel | undefined;
}
/**
 * A multi-step task: the list of steps, the current step's panel, and Back, Skip, Next and Finish.
 * Next checks the step's fields as a form submit does, then the step's own `validate`, before
 * moving on; focus moves to the new step's heading. It renders inline or inside a `Modal`.
 */
export declare function Wizard({ steps, currentId, defaultCurrentId, onCurrentIdChange, onFinish, onCancel, finishLabel, orientation, headingLevel, className, ...rest }: WizardProps): import("react").JSX.Element;
//# sourceMappingURL=wizard.d.ts.map