import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { Group, Input, NumberField as AriaNumberField } from '../../primitives/index.js';
import { toAriaControlProps } from '../field/field.js';
import { NumberScrubber, Stepper, createModifierStepHandler, numberFieldHooks as hooks, } from './number-field-parts.js';
import { snapNumberValue } from './snap-number-value.js';
/**
 * Takes React Aria's commits into the field, snapped or kept, and commits them, except while the
 * typed text is read on its way out of the input (Tab or blur): the field then commits once focus
 * leaves it, so Tab reaches the restore button. Blur and Enter still snap a value React Aria saw
 * as unchanged, and Shift or Alt with an arrow steps by the larger or smaller step.
 */
function useNumberEntry(state, options) {
    const { commitBehavior, bounds, steps } = options;
    const isLeaving = useRef(false);
    const commit = (value) => {
        const next = commitBehavior === 'snap' ? snapNumberValue(value, bounds) : value;
        state.setValue(Number.isNaN(next) ? null : next);
        if (!isLeaving.current)
            state.commit();
    };
    const finishUnchanged = (value) => {
        if (commitBehavior !== 'snap' || value !== state.value)
            return;
        if (snapNumberValue(value, bounds) !== value)
            commit(value);
    };
    const modifiedStep = createModifierStepHandler(state, steps);
    const toInputProps = (input) => ({
        onBlurCapture: () => {
            isLeaving.current = true;
        },
        onBlur: () => {
            finishUnchanged(input.numberValue);
            isLeaving.current = false;
        },
        onKeyDown: (event) => {
            modifiedStep(event);
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                finishUnchanged(input.numberValue);
            }
            // The typed number becomes the value before Tab moves focus, so dirty state is current.
            if (event.key === 'Tab') {
                isLeaving.current = true;
                input.commit();
                isLeaving.current = false;
            }
        },
    });
    return { commit, toInputProps };
}
export function DecimalControl({ state, control, config, steps }) {
    const { hideStepper, startAdornment, endAdornment, showScrubber, placeholder, commitBehavior = 'snap', ...rest } = config;
    const bounds = { minValue: config.minValue, maxValue: config.maxValue, step: config.step };
    const entry = useNumberEntry(state, { commitBehavior, bounds, steps });
    return (_jsx(AriaNumberField, { ...rest, ...toAriaControlProps(control), ...hooks.slot('box'), commitBehavior: "validate", value: state.value ?? Number.NaN, onChange: entry.commit, children: ({ state: inputState }) => (_jsxs(Group, { ...hooks.slot('group'), children: [hideStepper ? null : (_jsx(Stepper, { slot: "decrement", labelledBy: control['aria-labelledby'] })), showScrubber ? _jsx(NumberScrubber, { state: state, steps: steps }) : null, startAdornment ? _jsx("span", { ...hooks.slot('start'), children: startAdornment }) : null, _jsx(Input, { ...hooks.slot('input'), ref: control.ref, placeholder: placeholder, ...entry.toInputProps(inputState) }), endAdornment ? _jsx("span", { ...hooks.slot('end'), children: endAdornment }) : null, hideStepper ? null : (_jsx(Stepper, { slot: "increment", labelledBy: control['aria-labelledby'] }))] })) }));
}
//# sourceMappingURL=decimal-control.js.map