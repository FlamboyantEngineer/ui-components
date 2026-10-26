import { useCallback, useLayoutEffect, useRef } from 'react';
import { notificationListHooks as hooks } from './notification-row.js';
const rowSelector = `.${hooks.slotClass('item')}`;
const controlClasses = [hooks.slotClass('dismiss'), hooks.slotClass('read-toggle')];
function findFocusedRow(root, target) {
    const row = target?.closest(rowSelector);
    if (!target || !row || !root.contains(row))
        return null;
    const rows = [...root.querySelectorAll(rowSelector)];
    const index = rows.indexOf(row);
    return {
        row,
        controlClass: controlClasses.find((name) => target.closest(`.${name}`)) ?? null,
        neighbours: [...rows.slice(index + 1), ...rows.slice(0, index).reverse()],
    };
}
/** The same control in another row, else that row's first control. */
function findRowControl(row, controlClass) {
    const same = controlClass ? row.querySelector(`.${controlClass}`) : null;
    return same ?? row.querySelector('a[href], button:not(:disabled)');
}
/** The filter's chosen option, where focus goes when no row is left. */
function findFilterControl(root) {
    const filter = root.querySelector(`.${hooks.slotClass('filter')}`);
    return (filter?.querySelector('[aria-checked="true"]') ??
        filter?.querySelector('button') ??
        null);
}
/**
 * Keeps focus in the list when the row holding it leaves, such as after a dismissal or a read
 * toggle under the unread filter: focus moves to the same control of the next row, else of the
 * previous row, else to the filter, so it never falls to the page. Returns the root's focus
 * handlers.
 */
export function useRemovalFocus(rootRef) {
    const focused = useRef(null);
    useLayoutEffect(() => {
        const root = rootRef.current;
        if (!root)
            return;
        const document = root.ownerDocument;
        const previous = focused.current;
        const isLost = !document.activeElement || document.activeElement === document.body;
        if (previous && !previous.row.isConnected && isLost) {
            const next = previous.neighbours.find((row) => row.isConnected);
            (next ? findRowControl(next, previous.controlClass) : findFilterControl(root))?.focus();
        }
        // Rows may have moved: take the neighbours again from this render.
        focused.current = findFocusedRow(root, document.activeElement);
    });
    const onFocus = useCallback((event) => {
        const root = rootRef.current;
        if (root)
            focused.current = findFocusedRow(root, event.target);
    }, [rootRef]);
    // Focus moving elsewhere on the page forgets the row; a row leaving the page moves it nowhere.
    const onBlur = useCallback((event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && !rootRef.current?.contains(next))
            focused.current = null;
    }, [rootRef]);
    return { onFocus, onBlur };
}
//# sourceMappingURL=use-removal-focus.js.map