import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type StepListEditorStep } from './step-list.js';
import { type StepListEditorColumn } from './step-row.js';
export interface StepListEditorProps extends BaseProps, AriaLabellingProps {
    /** The text columns of every step, in order, such as an action and its expected result. */
    columns: readonly StepListEditorColumn[];
    /** The steps, controlled. */
    value?: readonly StepListEditorStep[] | undefined;
    /** The steps to start with, uncontrolled. Defaults to none. */
    defaultValue?: readonly StepListEditorStep[] | undefined;
    /** Called with the new steps after each edit, insertion, removal or move. */
    onChange?: ((steps: readonly StepListEditorStep[]) => void) | undefined;
    /** The steps as last saved: steps and fields that differ from them are marked dirty. */
    committedValue?: readonly StepListEditorStep[] | undefined;
    /** Shows the steps without handles, menus or the add button, their fields read-only. */
    isReadOnly?: boolean | undefined;
}
/**
 * Edits an ordered list of steps, each a numbered row with a multi-line text field per column
 * (such as an action, its data and its expected result). Steps are added, inserted above or below,
 * duplicated, moved and deleted from their menus, reordered by dragging their handles or with
 * Alt+ArrowUp and Alt+ArrowDown, and marked dirty against the committed steps. The value is plain
 * data.
 */
export declare function StepListEditor({ columns, value, defaultValue, onChange, committedValue, isReadOnly, className, 'aria-label': ariaLabel, ...rest }: StepListEditorProps): import("react").JSX.Element;
export type { StepListEditorStep } from './step-list.js';
export type { StepListEditorColumn } from './step-row.js';
//# sourceMappingURL=step-list-editor.d.ts.map