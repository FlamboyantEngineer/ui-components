import { type ReactNode, type RefObject } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import type { Completion } from './completion-match.js';
import type { CompletionsModel } from './use-completions.js';
/** A completion with the key the editor moves and acts on. */
export interface CompletionListItem extends Completion {
    id: Key;
}
/** What an item's renderer knows about it. */
export interface CompletionListItemState {
    /** The item is the active option, which Enter or Tab would insert. */
    isActive: boolean;
}
export interface CompletionListProps extends BaseProps, AriaLabellingProps {
    /** Shows the list. It opens only with items or an empty state to show. */
    isOpen: boolean;
    /** Called when the popover asks to close. */
    onOpenChange?: ((isOpen: boolean) => void) | undefined;
    /** The element the list opens against, such as the editor's frame or a caret marker it places. */
    anchorRef: RefObject<Element | null>;
    items: readonly CompletionListItem[];
    /** The active option, which the editor names in `aria-activedescendant`. */
    activeKey: Key | null;
    /** Called when the pointer moves over an option. */
    onActiveKeyChange?: ((key: Key) => void) | undefined;
    /** Called when an option is pressed. */
    onAction: (key: Key) => void;
    /** Draws an option's content instead of its label and description. */
    renderItem?: ((item: CompletionListItem, state: CompletionListItemState) => ReactNode) | undefined;
    /** Shown instead of the options while there are none, such as `No people found`. */
    renderEmptyState?: (() => ReactNode) | undefined;
    /** A line after the options, such as a match count and key hints. */
    footer?: ReactNode;
}
/** Draws a completion's content instead of its label and description. */
export type CompletionRenderer = (completion: Completion, state: CompletionListItemState) => ReactNode;
export interface ControlCompletionListProps {
    model: CompletionsModel;
    listId: string;
    anchorRef: RefObject<Element | null>;
    renderCompletion?: CompletionRenderer | undefined;
    /** The owning component's slot class for the list's popover. */
    className: string;
}
/**
 * A list of completions for an editor that keeps focus and owns the caret: a listbox in a
 * non-modal popover against an anchor, with the active option's documentation and a footer. It
 * draws options only: the editor moves `activeKey`, names the active option in
 * `aria-activedescendant` and calls `onAction`.
 */
export declare function CompletionList(props: CompletionListProps): import("react").JSX.Element;
/** The list of a text control's completions, drawn from its completions model. */
export declare function ControlCompletionList({ model, listId, anchorRef, renderCompletion, className, }: ControlCompletionListProps): import("react").JSX.Element;
export { getCompletionOptionId } from './completion-option-id.js';
export { matchCompletions, scoreCompletion } from './completion-match.js';
export type { Completion } from './completion-match.js';
export { createTriggerCompletions } from './trigger-completions.js';
export type { CompletionTrigger } from './trigger-completions.js';
export { useCompletions } from './use-completions.js';
export type { CompletionAnswer, CompletionContext, CompletionRange, CompletionReason, CompletionResult, Completions, CompletionSource, CompletionsModel, } from './use-completions.js';
export { toCompletionInputAttributes, useTextCompletions } from './text-completions.js';
export type { CompletionInputAttributes, TextCompletions } from './text-completions.js';
//# sourceMappingURL=completion-list.d.ts.map