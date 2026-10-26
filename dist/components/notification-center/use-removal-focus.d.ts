import { type FocusEvent, type RefObject } from 'react';
/**
 * Keeps focus in the list when the row holding it leaves, such as after a dismissal or a read
 * toggle under the unread filter: focus moves to the same control of the next row, else of the
 * previous row, else to the filter, so it never falls to the page. Returns the root's focus
 * handlers.
 */
export declare function useRemovalFocus(rootRef: RefObject<HTMLElement | null>): {
    onFocus: (event: FocusEvent<HTMLElement>) => void;
    onBlur: (event: FocusEvent<HTMLElement>) => void;
};
//# sourceMappingURL=use-removal-focus.d.ts.map