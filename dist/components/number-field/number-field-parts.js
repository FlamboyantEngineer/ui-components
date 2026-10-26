import { jsx as _jsx } from "react/jsx-runtime";
import { useId } from 'react';
import { Button as AriaButton, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { countDecimalPlaces } from '../../utils/count-decimal-places.js';
import { usePointerDrag } from '../../utils/use-pointer-drag.js';
export const numberFieldHooks = createHooks('number-field', [
    'box',
    'group',
    'decrement',
    'scrubber',
    'start',
    'input',
    'end',
    'increment',
]);
const hooks = numberFieldHooks;
/** How far a scrub travels, in pixels, for each step. */
const pixelsPerStep = 4;
const arrowDirections = { ArrowUp: 1, ArrowDown: -1 };
/**
 * The value `delta` away from `value`, kept in the range and rounded to the precision of both, so
 * decimal steps do not drift (0.1 + 0.2). An empty value steps up to the minimum and down to the
 * maximum (zero without one), as React Aria's plain arrow keys do.
 */
export function addStep(value, delta, steps) {
    const minimum = steps.minValue ?? -Infinity;
    const maximum = steps.maxValue ?? Infinity;
    if (value === null)
        return clamp((delta > 0 ? steps.minValue : steps.maxValue) ?? 0, minimum, maximum);
    const precision = Math.max(countDecimalPlaces(value), countDecimalPlaces(delta));
    const next = value + delta;
    return clamp(precision <= 100 ? Number(next.toFixed(precision)) : next, minimum, maximum);
}
/** The step a modifier chooses: `largeStep` with Shift, `smallStep` with Alt, else none. */
function modifierStep(event, steps) {
    if (event.shiftKey)
        return steps.largeStep;
    return event.altKey ? steps.smallStep : undefined;
}
function isLocked(state) {
    return state.isReadOnly || state.isDisabled;
}
/**
 * Shift and Alt with Arrow Up or Arrow Down step the value by `largeStep` or `smallStep` and commit
 * it; React Aria steps by `step` only for the plain keys.
 */
export function createModifierStepHandler(state, steps) {
    return (event) => {
        const direction = arrowDirections[event.key];
        const size = modifierStep(event, steps);
        if (!direction || size === undefined || isLocked(state))
            return;
        event.preventDefault();
        state.setValue(addStep(state.value, direction * size, steps));
        state.commit();
    };
}
/** A step button, named by its action and the field label (`Decrease Weight`). */
export function Stepper({ slot, labelledBy, }) {
    const id = useId();
    return (_jsx(AriaButton, { slot: slot, ...hooks.slot(slot), id: id, "aria-labelledby": labelledBy ? `${id} ${labelledBy}` : undefined, children: _jsx(Glyph, { name: slot === 'decrement' ? 'minus' : 'plus' }) }));
}
/**
 * A handle that steps the value as it is dragged sideways: one step every few pixels, toward the
 * end of the line (right in left-to-right text), by `largeStep` with Shift and `smallStep` with Alt.
 * The value commits when the drag ends. It is a pointer shortcut for the arrow keys, so assistive
 * technology does not see it.
 */
export function NumberScrubber({ state, steps, }) {
    const { direction } = useLocale();
    const drag = usePointerDrag({
        isDisabled: isLocked(state),
        onStart: (event) => {
            event.preventDefault();
            return { x: event.clientX, travelled: 0, value: state.value };
        },
        onMove: (event, current) => {
            const travelled = current.travelled + (event.clientX - current.x) * (direction === 'rtl' ? -1 : 1);
            const count = Math.trunc(travelled / pixelsPerStep);
            const size = modifierStep(event, steps) ?? steps.step;
            const value = count === 0 ? current.value : addStep(current.value, count * size, steps);
            Object.assign(current, {
                x: event.clientX,
                travelled: travelled - count * pixelsPerStep,
                value,
            });
            if (count !== 0)
                state.setValue(value);
        },
        onEnd: () => {
            if (!isLocked(state))
                state.commit();
        },
    });
    return (_jsx("span", { ...hooks.slot('scrubber'), "aria-hidden": "true", style: { touchAction: 'none' }, ...drag, children: _jsx(Glyph, { name: "scrub" }) }));
}
//# sourceMappingURL=number-field-parts.js.map