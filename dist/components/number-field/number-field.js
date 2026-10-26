import { jsx as _jsx } from "react/jsx-runtime";
import { useNumberFormatter } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { RadixControl } from './radix-control.js';
import { formatRadixNumber } from './radix-number.js';
import { DecimalControl } from './decimal-control.js';
import { numberFieldHooks as hooks } from './number-field-parts.js';
// Tolerates the binary rounding of decimal steps (0.1 + 0.2).
const STEP_TOLERANCE = 1e-9;
function isOnStep(value, step, origin) {
    const steps = (value - origin) / step;
    return Math.abs(steps - Math.round(steps)) < STEP_TOLERANCE;
}
/** The range and step error of a value, if any. An empty value passes; requiring one is the field's. */
function checkNumber(value, rules) {
    const { minValue, maxValue, step, format, strings } = rules;
    if (value === null)
        return null;
    if (rules.radix !== 10 && !Number.isSafeInteger(value))
        return {
            severity: 'error',
            message: strings.stepMismatch(format(1)),
            validity: 'stepMismatch',
        };
    if (minValue !== undefined && value < minValue) {
        const message = strings.rangeUnderflow(format(minValue));
        return { severity: 'error', message, validity: 'rangeUnderflow' };
    }
    if (maxValue !== undefined && value > maxValue) {
        const message = strings.rangeOverflow(format(maxValue));
        return { severity: 'error', message, validity: 'rangeOverflow' };
    }
    if (step !== undefined && step > 0 && !isOnStep(value, step, minValue ?? 0)) {
        return {
            severity: 'error',
            message: strings.stepMismatch(format(step)),
            validity: 'stepMismatch',
        };
    }
    return null;
}
/**
 * A field for a number, parsed and formatted for the locale, with steppers. It commits when focus
 * leaves the field, on Enter and on each step, and reports a value outside its range or off its
 * step. Adornments sit inside its frame; Shift and Alt step by larger and smaller amounts, and a
 * scrub handle steps by dragging.
 */
export function NumberField({ radix = 10, placeholder, hideStepper = false, startAdornment, endAdornment, smallStep, largeStep, showScrubber = false, commitBehavior = 'snap', ...props }) {
    const strings = useUiStrings();
    const { minValue, maxValue, step, formatOptions } = props;
    const formatter = useNumberFormatter(formatOptions);
    const { state, field, rest } = useFieldControl(props, {
        initialValue: null,
        emptyValue: null,
        check: (value) => checkNumber(value, {
            radix,
            minValue,
            maxValue,
            step,
            format: (number) => radix === 10 ? formatter.format(number) : formatRadixNumber(number, radix),
            strings,
        }),
    });
    const steps = { step: step ?? 1, smallStep, largeStep, minValue, maxValue };
    const data = { hideStepper, radix };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, data }), state: state, commitOnBlur: true, children: (control) => {
            const config = {
                ...rest,
                placeholder,
                hideStepper,
                startAdornment,
                endAdornment,
                showScrubber,
                commitBehavior,
            };
            return radix === 10 ? (_jsx(DecimalControl, { state: state, control: control, steps: steps, config: config })) : (_jsx(RadixControl, { state: state, control: control, radix: radix, steps: steps, config: config }));
        } }));
}
//# sourceMappingURL=number-field.js.map