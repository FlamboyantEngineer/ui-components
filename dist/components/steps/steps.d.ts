import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key, NativeProps, Orientation } from '../../core/props.js';
/** Where a step stands: done, being worked on, not reached, failed or passed over. */
export type StepsStatus = 'complete' | 'current' | 'upcoming' | 'error' | 'skipped';
/** `compact` drops descriptions and shows only the current step's label. */
export type StepsVariant = 'default' | 'compact';
export interface StepsItem {
    /** Identifies the step for `currentId` and `onAction`. */
    id: Key;
    /** The step's name. */
    label: ReactNode;
    /** A line under the label. */
    description?: ReactNode;
    /** Overrides the status read from the step's place before, at or after `currentId`. */
    status?: StepsStatus | undefined;
    /** Marks the step as one the reader may skip. */
    isOptional?: boolean | undefined;
    /** Keeps the step from being pressed. */
    isDisabled?: boolean | undefined;
}
export interface StepsProps extends BaseProps, AriaLabellingProps, Pick<NativeProps<'ol'>, 'ref'> {
    /** The steps, in order. */
    items: readonly StepsItem[];
    /** Every step is complete, with no current step. Defaults to false. */
    isComplete?: boolean | undefined;
    /** The step being worked on. */
    currentId?: Key | null | undefined;
    /** How the steps run. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** Defaults to `default`. */
    variant?: StepsVariant | undefined;
    /** Makes steps already reached pressable, and receives the `id` of the step pressed. */
    onAction?: ((id: Key) => void) | undefined;
    /** Keeps every step from being pressed. */
    isDisabled?: boolean | undefined;
}
/**
 * An ordered list of the steps of a task with where each one stands, the current one marked with
 * `aria-current="step"`. Steps already reached can be pressed to return to them.
 */
export declare function Steps({ items, currentId, isComplete, orientation, variant, onAction, isDisabled, className, ...rest }: StepsProps): import("react").JSX.Element;
//# sourceMappingURL=steps.d.ts.map