import type { JSX, KeyboardEvent } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { ButtonSize } from '../button/button.js';
import { type ActionRowAction } from './action-verbs.js';
export interface ActionRowActionsProps extends Pick<AriaLabellingProps, 'aria-label' | 'aria-labelledby'> {
    actions: readonly ActionRowAction[];
    size: ButtonSize;
    /** Draws the actions as one toolbar. */
    isToolbar: boolean;
    /** Collapses the actions that do not fit into a "more" menu. */
    isCollapsing: boolean;
}
/**
 * The actions slot: the buttons, optionally as one toolbar, optionally keeping only the
 * actions that fit and listing the others in a "more" menu at the end.
 */
export declare function ActionRowActions({ actions, size, isToolbar, isCollapsing, ...labels }: ActionRowActionsProps): JSX.Element;
/** Escape clears a selection, unless something inside the row handled it. */
export declare function createClearKey(onClear: (() => void) | undefined): (event: KeyboardEvent<HTMLElement>) => void;
//# sourceMappingURL=action-row-actions.d.ts.map