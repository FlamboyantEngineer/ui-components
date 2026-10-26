import type { ReactNode, Ref } from 'react';
import type { BaseProps, NativeProps, Tone } from '../../core/props.js';
import type { IconSource } from '../icon/icon.js';
export { ListView, ListViewItem } from './list-view.js';
/** Imperative access to a `List`. */
export interface ListHandle {
    /** Moves focus to the first enabled row. */
    focusFirst(): void;
}
export interface ListProps extends NativeProps<'ul'>, BaseProps {
    /** The rows are being loaded or updated: publishes `aria-busy` and `data-pending`. */
    isPending?: boolean | undefined;
    /** Ask the stylesheet for dividers between rows. */
    divided?: boolean | undefined;
    /** Called on ArrowUp from the first row, e.g. to return focus to an associated search field. */
    onNavigatePastStart?: (() => void) | undefined;
    /** Receives `focusFirst()`, e.g. for a search field that hands focus to the results. */
    handleRef?: Ref<ListHandle> | undefined;
}
export interface ListRowContentProps extends Omit<NativeProps<'span'>, 'title' | 'children'>, BaseProps {
    /** The row's main text. */
    title: ReactNode;
    /** Secondary text below the title, such as a `MetaLine`. */
    meta?: ReactNode;
    /** A built-in glyph name or icon node beside the title and meta, drawn through `IconLabel`. */
    icon?: IconSource;
    /** Decorative leading media (an avatar, a thumbnail). Ignored when `icon` is set. */
    leading?: ReactNode;
}
export type ListRowTone = Extract<Tone, 'neutral' | 'danger'>;
export interface ListRowProps extends Omit<NativeProps<'li'>, 'title' | 'children'>, BaseProps, Pick<ListRowContentProps, 'title' | 'meta' | 'icon' | 'leading'> {
    /** Makes the row's primary control a link, rendered through the provider's link renderer. */
    href?: string | undefined;
    /** Link target. `_blank` adds `rel="noopener noreferrer"` unless `rel` is given. */
    target?: string | undefined;
    /** The link's relationship to the current page. */
    rel?: string | undefined;
    /** Without `href`, makes the primary control a button. With `href`, runs when the link is followed. */
    onPress?: (() => void) | undefined;
    /** Runs on a middle-button click of a link row. */
    onAuxPress?: (() => void) | undefined;
    /** Controls after the primary control, such as an action button. They are never inside the link. */
    trailing?: ReactNode;
    /** The row is the current page or item: `aria-current` on its primary control. */
    isCurrent?: boolean | undefined;
    /** The row cannot be activated and is skipped by keyboard navigation. */
    isDisabled?: boolean | undefined;
    /** Semantic emphasis, such as an overdue or failed item. Defaults to `neutral`. */
    tone?: ListRowTone | undefined;
}
/**
 * A native list of rows with one tab stop: ArrowUp, ArrowDown, Home and End move focus between the
 * rows' primary controls, skipping disabled rows. Links, buttons and trailing controls keep their
 * ordinary roles.
 */
export declare function List({ isPending, divided, onNavigatePastStart, handleRef, className, ref, onKeyDown, onBlurCapture, children, ...rest }: ListProps): import("react").JSX.Element;
/**
 * The text of a row without any control: leading media or icon, title and meta. `ListRow` draws it
 * inside its primary control; use it alone inside an element that is itself the link or button.
 */
export declare function ListRowContent({ title, meta, icon, leading, className, ...rest }: ListRowContentProps): import("react").JSX.Element;
/**
 * One row of a `List`: a primary control (a link, a button or a focusable read-only body) holding
 * the row text, followed by optional trailing controls as siblings. A link row renders exactly one
 * link and nothing interactive inside it.
 */
export declare function ListRow({ title, meta, icon, leading, href, target, rel, onPress, onAuxPress, trailing, isCurrent, isDisabled, tone, className, onFocusCapture, ...rest }: ListRowProps): import("react").JSX.Element;
//# sourceMappingURL=list-row.d.ts.map