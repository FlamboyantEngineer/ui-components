// Whether focus is inside a field, and the moment it leaves.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
/**
 * A focused part of the root that unmounts (a restore button once the value is clean) drops focus
 * on the body without a blur, so focus goes to the control and stays in the field. Popovers restore
 * focus to their own triggers, so a part in one is left alone.
 */
function useFocusedPartRecovery({ getRoot, getControl }, isFocused) {
    const part = useRef(null);
    useLayoutEffect(() => {
        const element = part.current;
        if (!isFocused || !element || element.isConnected)
            return;
        part.current = null;
        const active = getRoot()?.ownerDocument.activeElement;
        if (!active || active.localName === 'body')
            getControl()?.focus();
    });
    return (event) => {
        const inside = getRoot()?.contains(event.target);
        part.current = inside ? event.target : null;
    };
}
/**
 * Whether focus is inside the field, popovers it opens included, and the handlers that track it.
 * Focus moving between the field's parts never leaves it. Focus that moves out of the root's DOM may
 * be entering a popover the field opened, which React reports through the root's `onFocus` before
 * the `focusin` reaches the window, so the field decides only then (or on the next task, if no
 * `focusin` follows). A browser renders between `focusout` and `focusin`, so deciding at `focusout`
 * would leave the field for a moment.
 */
export function useFieldFocus(options) {
    const { getRoot, onLeave } = options;
    const [isFocused, setIsFocused] = useState(false);
    const latest = useRef(onLeave);
    latest.current = onLeave;
    const pending = useRef(null);
    const cancelPending = () => {
        pending.current?.();
        pending.current = null;
    };
    const leave = () => {
        cancelPending();
        setIsFocused(false);
        latest.current();
    };
    useEffect(() => () => pending.current?.(), []);
    const recordPart = useFocusedPartRecovery(options, isFocused);
    return {
        isFocused,
        onFocus: (event) => {
            cancelPending();
            recordPart(event);
            setIsFocused(true);
        },
        onBlur: (event) => {
            const root = getRoot();
            const next = event.relatedTarget;
            if (next && root?.contains(next))
                return;
            const view = root?.ownerDocument.defaultView;
            if (!next || !view)
                return leave();
            cancelPending();
            let isPending = true;
            const settle = () => (isPending ? leave() : undefined);
            const timer = view.setTimeout(settle, 0);
            view.addEventListener('focusin', settle);
            pending.current = () => {
                isPending = false;
                view.clearTimeout(timer);
                view.removeEventListener('focusin', settle);
            };
        },
    };
}
//# sourceMappingURL=field-focus.js.map