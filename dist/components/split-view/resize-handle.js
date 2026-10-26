import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { clamp } from '../../utils/clamp.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
/** Arrow keys step this share of the extent; Shift+arrows step the fine share. */
export const RESIZE_KEYBOARD_STEP = 5;
export const RESIZE_KEYBOARD_FINE_STEP = 1;
const hooks = createHooks('resize-handle', ['grip', 'shield']);
const oneUnitPerPixel = () => 1;
function chain(first, second) {
    return (event) => {
        first?.(event);
        second(event);
    };
}
/**
 * Pointer dragging with pointer capture, and key steps. The latest value lives in a ref between
 * renders so a drag reports its last value when it ends.
 */
function useResizeInteraction(options) {
    const { orientation, value, minValue, maxValue, getUnitsPerPixel, onChange, onChangeEnd } = options;
    const { sizedPane = 'before', direction = 'ltr', onResizingChange } = options;
    const [isResizing, setResizing] = useState(false);
    // Pointer travel toward the inline end (or down) grows the pane before the separator.
    const sign = (orientation === 'vertical' && direction === 'rtl' ? -1 : 1) *
        (sizedPane === 'before' ? 1 : -1);
    const latest = useRef(value);
    if (!isResizing)
        latest.current = value;
    const axisCoordinate = (event) => orientation === 'vertical' ? event.clientX : event.clientY;
    const changeResizing = (next) => {
        setResizing(next);
        onResizingChange?.(next);
    };
    const move = (event, active) => {
        if (active.scale <= 0)
            return;
        const delta = (axisCoordinate(event) - active.start) * active.scale * sign;
        const next = clamp(active.startValue + delta, minValue, maxValue);
        if (next === latest.current)
            return;
        latest.current = next;
        onChange?.(next);
    };
    const pointer = usePointerDrag({
        isDisabled: options.isDisabled,
        onCancel: () => changeResizing(false),
        onStart: (event) => {
            event.preventDefault();
            latest.current = value;
            changeResizing(true);
            return { start: axisCoordinate(event), startValue: value, scale: getUnitsPerPixel() };
        },
        onMove: move,
        onEnd: (event, active, isCancelled) => {
            if (!isCancelled)
                move(event, active);
            changeResizing(false);
            onChangeEnd?.(latest.current);
        },
    });
    const step = (event) => {
        if (event.defaultPrevented)
            return;
        const next = resolveResizeKeyboardValue(event, options);
        if (next === null)
            return;
        event.preventDefault();
        if (next !== value)
            onChange?.(next);
        onChangeEnd?.(next);
    };
    return { isResizing, pointer, step };
}
/**
 * The window-splitter keyboard contract: the arrow keys along the separator's axis move it by 5 % of
 * the extent, Shift+arrows by 1 %, Home and End jump to the smallest and largest value. Moving the
 * separator toward the inline end (or down) grows the pane before it. Returns the clamped next value,
 * or `null` for a key that does not resize.
 */
export function resolveResizeKeyboardValue(event, { orientation, value, minValue, maxValue, extent, sizedPane = 'before', direction = 'ltr', }) {
    if (event.key === 'Home')
        return minValue;
    if (event.key === 'End')
        return maxValue;
    const step = (extent * (event.shiftKey ? RESIZE_KEYBOARD_FINE_STEP : RESIZE_KEYBOARD_STEP)) / 100;
    const [backKey, forwardKey] = orientation === 'vertical' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (event.key !== backKey && event.key !== forwardKey)
        return null;
    const forward = event.key === forwardKey;
    const towardEnd = orientation === 'vertical' && direction === 'rtl' ? !forward : forward;
    const grows = towardEnd === (sizedPane === 'before');
    return clamp(value + (grows ? step : -step), minValue, maxValue);
}
/** An enabled handle's tab stop and handlers: the caller's handlers run before the handle's own. */
function chainHandleEvents(caller, { pointer, step }) {
    return {
        tabIndex: 0,
        onPointerDown: chain(caller.onPointerDown, pointer.onPointerDown),
        onPointerMove: chain(caller.onPointerMove, pointer.onPointerMove),
        onPointerUp: chain(caller.onPointerUp, pointer.onPointerUp),
        onPointerCancel: chain(caller.onPointerCancel, pointer.onPointerCancel),
        onLostPointerCapture: chain(caller.onLostPointerCapture, pointer.onLostPointerCapture),
        onKeyDown: chain(caller.onKeyDown, step),
    };
}
/**
 * A focusable window splitter (`role="separator"`) that resizes the pane beside it by pointer drag,
 * with pointer capture, and by keyboard. While a drag is in progress it renders a viewport shield so
 * the stylesheet can keep the resize cursor everywhere.
 */
export function ResizeHandle({ orientation, value, minValue, maxValue, extent = 100, getUnitsPerPixel = oneUnitPerPixel, sizedPane = 'before', onChange, onChangeEnd, onResizingChange, isDisabled = false, className, ...rest }) {
    const { direction } = useLocale();
    const interaction = useResizeInteraction({
        orientation,
        value,
        minValue,
        maxValue,
        extent,
        sizedPane,
        direction,
        getUnitsPerPixel,
        onChange,
        onChangeEnd,
        onResizingChange,
        isDisabled,
    });
    // A disabled handle ignores pointer and keys itself; the caller's handlers in `rest` still run.
    const interactive = isDisabled ? {} : chainHandleEvents(rest, interaction);
    return (_jsxs(_Fragment, { children: [_jsx("div", { ...rest, ...interactive, role: "separator", "aria-orientation": orientation, "aria-valuenow": Math.round(value), "aria-valuemin": Math.round(minValue), "aria-valuemax": Math.round(maxValue), "aria-disabled": isDisabled || undefined, ...hooks.root({
                    className,
                    data: { orientation, resizing: interaction.isResizing, disabled: isDisabled },
                }), children: _jsx("span", { ...hooks.slot('grip'), "aria-hidden": "true" }) }), interaction.isResizing ? (_jsx("div", { ...hooks.slot('shield', { orientation }), "aria-hidden": "true", style: { position: 'fixed', inset: 0 } })) : null] }));
}
//# sourceMappingURL=resize-handle.js.map