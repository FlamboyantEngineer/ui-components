import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { Button as AriaButton, Input, TextField as AriaTextField } from '../../primitives/index.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toAriaControlProps } from '../field/field.js';
import { addStep, NumberScrubber, numberFieldHooks as hooks, } from './number-field-parts.js';
import { formatRadixNumber, parseRadixNumber } from './radix-number.js';
import { snapNumberValue } from './snap-number-value.js';
function useRadixEntry({ state, radix, config, steps }) {
    const formatted = formatRadixNumber(state.value, radix);
    const [draft, setDraft] = useState(formatted);
    const [previous, setPrevious] = useState(formatted);
    if (previous !== formatted) {
        setPrevious(formatted);
        setDraft(formatted);
    }
    const finish = (commit) => {
        const value = parseRadixNumber(draft, radix);
        if (value !== null && Number.isNaN(value)) {
            setDraft(formatted);
            return;
        }
        const next = value === null || config.commitBehavior === 'validate'
            ? value
            : snapNumberValue(value, config);
        state.setValue(next);
        setDraft(formatRadixNumber(next, radix));
        if (commit)
            state.commit();
    };
    const step = (direction, event) => {
        if (state.isDisabled || state.isReadOnly)
            return;
        const amount = (event?.shiftKey ? steps.largeStep : event?.altKey ? steps.smallStep : undefined) ??
            steps.step;
        const parsed = parseRadixNumber(draft, radix);
        const value = parsed !== null && Number.isNaN(parsed) ? state.value : parsed;
        const next = addStep(value, direction * amount, steps);
        state.setValue(next);
        setDraft(formatRadixNumber(next, radix));
        state.commit();
    };
    const onKeyDown = (event) => {
        if (event.nativeEvent.isComposing || state.isReadOnly)
            return;
        if (event.key === 'Enter') {
            event.preventDefault();
            finish(true);
        }
        if (event.key === 'Tab')
            finish(false);
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            step(event.key === 'ArrowUp' ? 1 : -1, event);
        }
    };
    return { draft, setDraft, finish, step, onKeyDown };
}
/** A radix spinbutton on a text-field building block; numeric value and stepping stay base independent. */
export function RadixControl(props) {
    const { state, control, config, steps } = props;
    const { hideStepper, showScrubber, startAdornment, endAdornment, placeholder, minValue, maxValue, name, } = config;
    const input = useRef(null);
    const strings = useUiStrings();
    const entry = useRadixEntry(props);
    const stepper = (direction) => {
        const slot = direction === 1 ? 'increment' : 'decrement';
        const bound = direction === 1 ? maxValue : minValue;
        const atBound = state.value !== null &&
            bound !== undefined &&
            (direction === 1 ? state.value >= bound : state.value <= bound);
        return (_jsx(AriaButton, { ...hooks.slot(slot), "aria-label": direction === 1 ? strings.numberIncrease : strings.numberDecrease, "aria-labelledby": `${control.id}-${slot} ${control['aria-labelledby'] ?? control.id}`, id: `${control.id}-${slot}`, isDisabled: state.isDisabled || state.isReadOnly || atBound, excludeFromTabOrder: true, onPress: () => {
                entry.step(direction);
                input.current?.focus();
            }, children: _jsx(Glyph, { name: direction === 1 ? 'plus' : 'minus' }) }));
    };
    return (_jsxs(AriaTextField, { ...toAriaControlProps(control), ...hooks.slot('box'), value: entry.draft, onChange: entry.setDraft, children: [_jsxs("div", { ...hooks.slot('group'), children: [hideStepper ? null : stepper(-1), showScrubber ? _jsx(NumberScrubber, { state: state, steps: steps }) : null, startAdornment ? _jsx("span", { ...hooks.slot('start'), children: startAdornment }) : null, _jsx(Input, { ...hooks.slot('input'), role: "spinbutton", "aria-valuenow": state.value ?? undefined, "aria-valuetext": state.value === null ? undefined : formatRadixNumber(state.value, props.radix), "aria-valuemin": minValue, "aria-valuemax": maxValue, inputMode: props.radix === 16 ? 'text' : 'numeric', ref: mergeRefs(input, control.ref), placeholder: placeholder, onBlur: () => entry.finish(false), onKeyDown: entry.onKeyDown }), endAdornment ? _jsx("span", { ...hooks.slot('end'), children: endAdornment }) : null, hideStepper ? null : stepper(1)] }), name ? (_jsx("input", { type: "hidden", name: name, value: state.value ?? '', disabled: state.isDisabled })) : null] }));
}
//# sourceMappingURL=radix-control.js.map