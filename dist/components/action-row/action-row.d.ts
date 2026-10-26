import type { ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import type { ButtonSize } from '../button/button.js';
import { type ActionRowAction } from './action-verbs.js';
/** `visible` keeps every action in the row; `menu` collapses those that do not fit into a menu. */
export type ActionRowOverflow = 'visible' | 'menu';
export interface ActionRowProps extends Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'>, BaseProps {
    /** The actions, drawn as icon buttons: custom actions in their order, then the verbs in theirs. */
    actions: readonly ActionRowAction[];
    /** Content at the start of the row, before the actions (a title, a filter, a status line). */
    lead?: ReactNode;
    /** Size of every action button. Defaults to `md`. */
    size?: ButtonSize | undefined;
    /**
     * Draws the actions as one toolbar, named by `aria-label` or `aria-labelledby`: one tab
     * stop, with the arrow keys moving between the actions.
     */
    toolbar?: boolean | undefined;
    /** What happens to actions that do not fit. Defaults to `visible`. */
    overflow?: ActionRowOverflow | undefined;
    /**
     * Makes the row a selection bar for a collection: it shows this count with a clear button, and
     * renders only while the count is above zero.
     */
    selectedCount?: number | undefined;
    /** Clears the selection: the clear button and Escape inside the row call it. */
    onClearSelection?: (() => void) | undefined;
}
/**
 * A row of icon-button actions described as data: standard verbs with fixed glyphs, labels and
 * places, and custom actions, each with a tooltip. It can be one toolbar, collapse actions into a
 * menu and serve as a collection's selection bar. Renders nothing without actions or lead content.
 */
export declare function ActionRow({ actions, lead, size, toolbar, overflow, selectedCount, onClearSelection, 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, className, ...rest }: ActionRowProps): import("react").JSX.Element | null;
export { actionVerbs, orderActions } from './action-verbs.js';
export type { ActionRowAction, ActionRowCustomAction, ActionRowVerbAction, ActionVerb, } from './action-verbs.js';
//# sourceMappingURL=action-row.d.ts.map