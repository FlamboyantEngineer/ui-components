import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { TooltipContext, TooltipTriggerStateContext, useFocusVisible, } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { useResizeObserver } from '../../utils/use-resize-observer.js';
import { Button } from '../button/button.js';
import { TOOLTIP_DELAY, TooltipPanel } from '../tooltip/tooltip.js';
const hooks = createHooks('truncation-tooltip', ['panel', 'toggle']);
/** Elements that take focus; keyboard focus on the nearest one holding the text reveals the tooltip. */
const focusableSelector = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable="true"]';
/** Whether an element's content is cut by its box (an inline ellipsis or a line clamp). */
function isTruncated(element) {
    return (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
}
/** React Aria tooltip trigger state that opens only while the text in `ref` is cut. */
function useTruncationState(ref) {
    const timer = useRef(undefined);
    const [isOpen, setOpen] = useState(false);
    const cancel = useCallback(() => {
        clearTimeout(timer.current);
        timer.current = undefined;
    }, []);
    const open = useCallback(() => {
        cancel();
        if (ref.current && isTruncated(ref.current))
            setOpen(true);
    }, [cancel, ref]);
    const close = useCallback(() => {
        cancel();
        setOpen(false);
    }, [cancel]);
    const schedule = useCallback((delay) => {
        cancel();
        timer.current = setTimeout(open, delay);
    }, [cancel, open]);
    useEffect(() => cancel, [cancel]);
    return useMemo(() => ({ isOpen, shouldSkipAnimation: false, open, close, schedule }), [isOpen, open, close, schedule]);
}
/**
 * Opens on keyboard focus of the nearest focusable element holding the text and closes on its blur.
 * Focus while the reader uses a pointer (a press, or focus a script moves after one) is not visible
 * focus and opens nothing, as React Aria's tooltips decide.
 */
function useFocusReveal(ref, { open, close }) {
    const { isFocusVisible } = useFocusVisible();
    const isVisible = useRef(isFocusVisible);
    isVisible.current = isFocusVisible;
    useEffect(() => {
        const target = ref.current?.closest(focusableSelector);
        if (!target)
            return;
        const onFocus = () => {
            if (isVisible.current)
                open();
        };
        const onBlur = () => close();
        target.addEventListener('focus', onFocus);
        target.addEventListener('blur', onBlur);
        return () => {
            target.removeEventListener('focus', onFocus);
            target.removeEventListener('blur', onBlur);
        };
    }, [ref, open, close]);
}
/** Closes on Escape, consuming the key only while the tooltip is open. */
function useEscapeToClose({ isOpen, close }) {
    useEffect(() => {
        if (!isOpen)
            return;
        const onKeyDown = (event) => {
            if (event.key !== 'Escape')
                return;
            event.stopPropagation();
            close();
        };
        document.addEventListener('keydown', onKeyDown, true);
        return () => document.removeEventListener('keydown', onKeyDown, true);
    }, [isOpen, close]);
}
/**
 * Whether the text in `ref` is cut, measured when it changes and on resize. Whole text is not
 * measured: it keeps the value it had before it was shown whole, which it returns to when cut again.
 */
function useIsCut(ref, children, isWhole) {
    const [isCut, setCut] = useState(false);
    const measure = useCallback(() => {
        if (!isWhole)
            setCut(ref.current !== null && isTruncated(ref.current));
    }, [ref, isWhole]);
    useResizeObserver([ref], measure);
    useLayoutEffect(measure, [measure, children]);
    return isCut;
}
/** The "Show more" or "Show less" control of expandable text. */
function ExpandControl({ isExpanded, textId, onPress, }) {
    const strings = useUiStrings();
    return (_jsx(Button, { variant: "link", size: "xs", className: hooks.slotClass('toggle'), "aria-expanded": isExpanded, "aria-controls": textId, onPress: onPress, children: isExpanded ? strings.showLess : strings.showMore }));
}
/** The text's pointer handlers: rest to open after `delay`, leave or press to close. */
function createPointerHandlers(state, delay) {
    const { schedule, close } = state;
    return {
        onPointerEnter: (event) => {
            if (event.pointerType !== 'touch')
                schedule(delay);
        },
        onPointerLeave: () => close(),
        onPointerDown: () => close(),
    };
}
/**
 * Text that shows its full content in a tooltip only while the stylesheet cuts it short. The
 * tooltip is visual: the text is already in the page, so nothing new is announced.
 */
export function TruncationTooltip({ children, placement = 'top', delay = TOOLTIP_DELAY, expandable = false, isExpanded, defaultExpanded = false, onExpandedChange, className, ref: callerRef, ...rest }) {
    const [ref, setRef] = useForwardedRef(callerRef);
    const state = useTruncationState(ref);
    useFocusReveal(ref, state);
    useEscapeToClose(state);
    const pointerHandlers = createPointerHandlers(state, delay);
    const [expanded, setExpanded] = useControllableState(isExpanded, defaultExpanded, onExpandedChange);
    const isWhole = expandable && expanded;
    const isCut = useIsCut(ref, children, isWhole);
    const textId = `${useId()}-text`;
    const id = rest.id ?? (expandable ? textId : undefined);
    return (_jsxs(_Fragment, { children: [_jsx("span", { ...rest, id: id, ...hooks.root({ className, data: { expanded: isWhole } }), ...pointerHandlers, ref: setRef, children: children }), expandable && (isWhole || isCut) ? (_jsx(ExpandControl, { isExpanded: isWhole, textId: id ?? textId, onPress: () => {
                    state.close();
                    setExpanded(!isWhole);
                } })) : null, _jsx(TooltipContext.Provider, { value: null, children: _jsx(TooltipTriggerStateContext.Provider, { value: state, children: _jsx(TooltipPanel, { variant: "default", className: hooks.slotClass('panel'), triggerRef: ref, placement: placement, children: children }) }) })] }));
}
//# sourceMappingURL=truncation-tooltip.js.map