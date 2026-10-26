import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { BooleanControl } from './boolean-controls.js';
const hooks = createHooks('boolean-field');
function serialize(value) {
    return value === null ? 'unset' : String(value);
}
/**
 * A field for a true-or-false value, drawn as a checkbox, a switch, two named segments, a select or
 * a toggle button. It may also hold no value (`null`): required, it is then invalid; with
 * `allowsUnset`, pressing returns to it.
 */
export function BooleanField({ variant = 'checkbox', trueLabel, falseLabel, unsetLabel, allowsUnset = false, ...props }) {
    const strings = useUiStrings();
    const { state, field } = useFieldControl(props, {
        initialValue: null,
        emptyValue: allowsUnset ? null : undefined,
    });
    const labels = {
        true: trueLabel ?? strings.valueTrue,
        false: falseLabel ?? strings.valueFalse,
        unset: unsetLabel ?? strings.valueUnset,
        hasCustom: trueLabel !== undefined || falseLabel !== undefined,
    };
    const data = { variant, value: serialize(state.value) };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, data }), state: state, children: (control) => (_jsx(BooleanControl, { control: control, state: state, variant: variant, label: field.label, labels: labels, allowsUnset: allowsUnset, name: props.name, size: field.size ?? 'md' })) }));
}
//# sourceMappingURL=boolean-field.js.map