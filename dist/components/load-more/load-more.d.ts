import { type Ref } from 'react';
import type { BaseProps } from '../../core/props.js';
import { type ButtonProps, type ButtonSize, type ButtonVariant } from '../button/button.js';
export interface LoadMoreProps extends Pick<ButtonProps, 'onError' | 'isPending' | 'isDisabled' | 'pendingLabel'>, BaseProps {
    /** The load button. */
    ref?: Ref<HTMLButtonElement> | undefined;
    /**
     * Requests the next page. The caller owns cursors, requests and errors. When it returns a promise,
     * the control is pending until the promise settles.
     */
    onLoadMore?: (() => void | Promise<unknown>) | undefined;
    /** An authoritative count of entries left to load, shown as "(N remaining)". Omit when unknown. */
    remainingCount?: number | undefined;
    /** Names the collection after the visible text in the accessible name, e.g. "messages". */
    itemLabel?: string | undefined;
    /** The visible action text. Defaults to the provider's `loadMore` string. */
    label?: string | undefined;
    /** Emphasis. Defaults to `secondary`. */
    variant?: ButtonVariant | undefined;
    /** Block size. Defaults to `sm`. */
    size?: ButtonSize | undefined;
    /** Also request the next page whenever the control is in view and idle, for endless scrolling. */
    autoLoad?: boolean | undefined;
    /**
     * With `autoLoad`, load ahead: count the control as in view while it is within this many heights
     * of its scrolling container below the visible area, as React Aria's `scrollOffset`.
     */
    scrollOffset?: number | undefined;
}
/** One control that fetches the next page of a collection, on press or as it scrolls into view. */
export declare function LoadMore({ onLoadMore, onError, isPending, isDisabled, autoLoad, scrollOffset, remainingCount, itemLabel, label, variant, size, className, ref, ...rest }: LoadMoreProps): import("react").JSX.Element;
//# sourceMappingURL=load-more.d.ts.map