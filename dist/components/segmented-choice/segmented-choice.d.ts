import type { Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Orientation, Size } from '../../core/props.js';
import type { ElementRender } from '../../utils/render-element.js';
import { type IconSource } from '../icon/icon.js';
import { type SegmentedChoiceSelectionMode, type SegmentedChoiceValue } from './choice-selection.js';
import type { PendingChangeHandler } from './pending-change.js';
export type { SegmentedChoiceSelectionMode, SegmentedChoiceValue } from './choice-selection.js';
export type SegmentedChoiceSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** `equal` divides the available width evenly; `content` sizes each segment to its label. */
export type SegmentedChoiceSizing = 'equal' | 'content';
export interface SegmentedChoiceOption {
    value: string;
    /** The segment's text and accessible name. */
    label: string;
    /** A decorative icon before the label, or the whole segment with `iconOnly`. */
    icon?: IconSource;
    /** A count after the label, also read in the segment's name. Zero, negative and non-finite values show nothing. */
    count?: number | null | undefined;
    isDisabled?: boolean | undefined;
}
/** The states a segmented choice passes to `render` with its root's props. */
export interface SegmentedChoiceRenderState {
    /** How the segments are laid out. */
    orientation: Orientation;
    /** The whole group is disabled. */
    isDisabled: boolean;
}
export interface SegmentedChoiceProps<M extends SegmentedChoiceSelectionMode = 'single'> extends BaseProps, AriaLabellingProps {
    /** The group element. */
    ref?: Ref<HTMLDivElement> | undefined;
    /** The segments, in order. */
    options: readonly SegmentedChoiceOption[];
    /** `single` (the default) picks one value; `multiple` presses any number of segments. */
    selectionMode?: M | undefined;
    /** The value in effect (controlled): one value or `null`, or a list with `multiple`. */
    value?: SegmentedChoiceValue<M> | undefined;
    /** The initial value when uncontrolled. */
    defaultValue?: SegmentedChoiceValue<M> | undefined;
    /**
     * Receives the new value: the picked value or `null`, or the pressed values in option order. A
     * returned promise keeps the choice pending until it settles; a rejection puts the value back.
     */
    onChange?: PendingChangeHandler<SegmentedChoiceValue<M>> | undefined;
    /** Single selection: the value comes from elsewhere; picking its segment again commits it. */
    isInherited?: boolean | undefined;
    /** Single selection: picking the selected segment of an explicit value clears it to `null`. */
    isClearable?: boolean | undefined;
    /** Segments stay focusable but picking does nothing. */
    isReadOnly?: boolean | undefined;
    /** Marks the group invalid. */
    isInvalid?: boolean | undefined;
    /** Disables every segment. */
    isDisabled?: boolean | undefined;
    /** Lays the segments out in a row or a column. Defaults to `horizontal`. */
    orientation?: Orientation | undefined;
    /** Segment block size. Defaults to `md`. */
    size?: SegmentedChoiceSize | undefined;
    /** How segments share the width. Defaults to `equal`. */
    sizing?: SegmentedChoiceSizing | undefined;
    /** Each segment shows only its icon, named by its label, which its tooltip shows. */
    iconOnly?: boolean | undefined;
    /** Option counts above this show as `<max>+`. Defaults to 99. */
    countMax?: number | undefined;
    /** Submits the value with a form under this name, one hidden input per selected value. */
    name?: string | undefined;
    /** Replaces the root `<div>` with the caller's own, given its props and the group's state. */
    render?: ElementRender<'div', SegmentedChoiceRenderState> | undefined;
}
/**
 * One of a few mutually exclusive values, drawn as a run of segments, or with
 * `selectionMode="multiple"` a group of toggles that press independently. A selection indicator
 * slides between segments as the choice moves.
 */
export declare function SegmentedChoice<M extends SegmentedChoiceSelectionMode = 'single'>({ options, selectionMode, value, defaultValue, onChange, isInherited, isClearable, isReadOnly, isInvalid, size, sizing, iconOnly, countMax, name, render, className, ...rest }: SegmentedChoiceProps<M>): import("react").JSX.Element;
//# sourceMappingURL=segmented-choice.d.ts.map