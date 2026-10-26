import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { FocusScope as AriaFocusScope, useFocusManager as useAriaFocusManager, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { resolveFocusTarget, useFocusReturn } from '../../utils/focus-target.js';
import { mergeRefs } from '../../utils/merge-props.js';
const hooks = createHooks('focus-scope');
/**
 * Moves focus to the caller's targets. It renders inside the building block's scope, after the root, so
 * its mount effect runs before the scope's `autoFocus` (which then finds focus inside) and its
 * unmount cleanup after the scope has stopped containing focus (which would pull focus back).
 */
function FocusTargets({ containerRef, initialFocus, finalFocus }) {
    const initialRef = useRef(initialFocus);
    useEffect(() => {
        resolveFocusTarget(initialRef.current)?.focus();
    }, []);
    useFocusReturn({ containerRef, finalFocus, fallback: null });
    return null;
}
/**
 * A region that manages focus for its content: it can keep Tab and
 * Shift+Tab inside (`contain`, which may switch on and off while mounted), focus an element on
 * mount (`autoFocus`, `initialFocus`) and return focus on unmount (`restoreFocus`, `finalFocus`).
 * `useFocusManager` moves focus within it.
 */
export function FocusScope({ contain = false, restoreFocus = false, autoFocus = false, initialFocus, finalFocus, className, children, ref, ...rest }) {
    const rootRef = useRef(null);
    const mergedRef = useMemo(() => mergeRefs(rootRef, ref), [ref]);
    return (_jsxs(AriaFocusScope, { contain: contain, restoreFocus: restoreFocus, autoFocus: autoFocus, children: [_jsx("div", { ...rest, ...hooks.root({ className, props: rest, data: { contain } }), ref: mergedRef, children: children }), _jsx(FocusTargets, { containerRef: rootRef, initialFocus: initialFocus, finalFocus: finalFocus })] }));
}
/** The focus manager of the nearest `FocusScope`, or `undefined` outside any scope. */
export function useFocusManager() {
    return useAriaFocusManager();
}
//# sourceMappingURL=focus-scope.js.map