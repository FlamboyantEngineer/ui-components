import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { TooltipContext, TooltipTriggerStateContext, useTooltipTrigger, } from '../../primitives/index.js';
import { TOOLTIP_DELAY, TooltipPanel } from '../tooltip/tooltip.js';
/** Tooltip state that opens `TOOLTIP_DELAY` milliseconds after a hover, or at once on focus. */
function useTooltipState() {
    const timer = useRef(undefined);
    const [isOpen, setOpen] = useState(false);
    useEffect(() => () => clearTimeout(timer.current), []);
    return useMemo(() => ({
        isOpen,
        shouldSkipAnimation: false,
        open: (immediate) => {
            clearTimeout(timer.current);
            if (immediate)
                setOpen(true);
            else
                timer.current = setTimeout(() => setOpen(true), TOOLTIP_DELAY);
        },
        close: () => {
            clearTimeout(timer.current);
            setOpen(false);
        },
    }), [isOpen]);
}
/**
 * A `<time>` element that takes focus and shows `tooltip` on hover and keyboard focus. React Aria's
 * tooltip trigger drives it directly: its `Focusable` expects an interactive role, which a
 * timestamp does not have.
 */
export function TimeWithTooltip({ tooltip, tooltipClassName, ...rest }) {
    const ref = useRef(null);
    const state = useTooltipState();
    const { triggerProps, tooltipProps } = useTooltipTrigger({}, state, ref);
    return (_jsxs(_Fragment, { children: [_jsx("time", { ...rest, ...triggerProps, tabIndex: 0, ref: ref }), _jsx(TooltipContext.Provider, { value: { ...tooltipProps, triggerRef: ref }, children: _jsx(TooltipTriggerStateContext.Provider, { value: state, children: _jsx(TooltipPanel, { variant: "default", className: tooltipClassName, children: tooltip }) }) })] }));
}
//# sourceMappingURL=relative-time-tooltip.js.map