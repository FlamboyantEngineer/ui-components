import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useRef } from 'react';
import { Switch, ToggleButton } from '../../primitives/index.js';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { useWidestTextWidth } from '../../utils/use-widest-text-width.js';
import { Checkbox, cycleCheckState } from '../checkbox/checkbox.js';
import { FieldPreviousValue, toAriaControlProps, } from '../field/field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { SelectControl } from '../select-field/select-field.js';
const hooks = createHooks('boolean-field', [
    'switch',
    'track',
    'thumb',
    'caption',
    'form-value',
    'toggle-button',
    'previous',
]);
const controls = {
    checkbox: CheckControl,
    switch: CheckControl,
    segmented: SegmentedControl,
    dropdown: DropdownControl,
    'toggle-button': ToggleButtonControl,
};
function labelOf(value, labels) {
    if (value === null)
        return labels.unset;
    return value ? labels.true : labels.false;
}
/** A switch shows its state by position, so only the caller's labels or the unset state caption it. */
function switchCaptionOf(value, labels) {
    if (value === null || labels.hasCustom)
        return labelOf(value, labels);
    return null;
}
/** Sets and commits a picked value. */
function pick(state, value) {
    state.setValue(value);
    state.commit();
}
/** What a press gives: the other value, or with `allowsUnset` the next of unset, true and false. */
function pressedValue({ state, allowsUnset }) {
    return allowsUnset ? cycleCheckState(state.value) : state.value !== true;
}
function toKey(value) {
    return value === null ? null : String(value);
}
/** The boolean state seen as a select's keys: `'true'`, `'false'`, or `null` while unset. */
function toKeyState(state) {
    return {
        ...state,
        value: toKey(state.value),
        committedValue: toKey(state.committedValue),
        setValue: (key) => state.setValue(key === null ? null : key === 'true'),
    };
}
/** A hidden input that submits `true` or `false`, and nothing while unset or disabled. */
function FormValue({ name, state, }) {
    if (!name)
        return null;
    return (_jsx("input", { ...hooks.slot('form-value'), type: "hidden", name: name, value: String(state.value), disabled: state.value === null || state.isDisabled }));
}
function SegmentedControl({ control, state, labels, allowsUnset, name, size, }) {
    const aria = toAriaControlProps(control);
    return (_jsxs(_Fragment, { children: [_jsx(SegmentedChoice, { id: aria.id, "aria-label": aria['aria-label'], "aria-labelledby": aria['aria-labelledby'], "aria-describedby": aria['aria-describedby'], isInvalid: aria.isInvalid, isReadOnly: aria.isReadOnly, isDisabled: aria.isDisabled, size: size, options: [
                    ...(allowsUnset ? [{ value: 'unset', label: labels.unset }] : []),
                    { value: 'false', label: labels.false },
                    { value: 'true', label: labels.true },
                ], value: state.value === null && allowsUnset ? 'unset' : toKey(state.value), onChange: (next) => pick(state, next === null || next === 'unset' ? null : next === 'true') }), _jsx(FormValue, { name: name, state: state })] }));
}
// The select's own form value would name its unset option by a generated key, so the field submits
// through its hidden input instead.
function DropdownControl({ control, state, label, labels, allowsUnset, name, }) {
    return (_jsxs(_Fragment, { children: [_jsx(SelectControl, { control: control, state: toKeyState(state), label: label, isMultiple: false, options: [
                    { id: 'true', label: labels.true },
                    { id: 'false', label: labels.false },
                ], placeholder: labels.unset, emptyLabel: allowsUnset ? labels.unset : undefined, filterable: false }), _jsx(FormValue, { name: name, state: state })] }));
}
/**
 * A toggle button pressed while true, named like the dropdown's trigger by its caption (the current
 * value's name) and the field's label. The caption keeps the width of the widest name, so the
 * button never resizes.
 */
function ToggleButtonControl(props) {
    const { control, state, labels } = props;
    const captionId = useId();
    const captionRef = useRef(null);
    const width = useWidestTextWidth(captionRef, [labels.true, labels.false, labels.unset]);
    const style = width === null
        ? undefined
        : measuredProperty('boolean-field-caption-width', width);
    // In the control-only layout the button names itself by `aria-label`, read after the caption.
    const labelledBy = `${captionId} ${control['aria-labelledby'] ?? control.id}`;
    return (_jsxs(_Fragment, { children: [state.isDirty ? (_jsx(FieldPreviousValue, { className: hooks.slotClass('previous'), children: labelOf(state.committedValue, labels) })) : null, _jsx(ToggleButton, { ...hooks.slot('toggle-button', { indeterminate: state.value === null }), ref: control.ref, id: control.id, "aria-label": control['aria-label'], "aria-labelledby": labelledBy, "aria-describedby": control['aria-describedby'], isSelected: state.value === true, isDisabled: control.disabled, onChange: () => pick(state, pressedValue(props)), children: _jsx("span", { ...hooks.slot('caption'), id: captionId, ref: captionRef, style: style, children: labelOf(state.value, labels) }) }), _jsx(FormValue, { name: props.name, state: state })] }));
}
function CheckControl(props) {
    const { control, state, variant, labels, name, size } = props;
    const shared = {
        ...toAriaControlProps(control),
        inputRef: control.ref,
        isSelected: state.value === true,
        onChange: () => pick(state, pressedValue(props)),
        name,
        value: 'true',
    };
    if (variant === 'checkbox')
        return _jsx(Checkbox, { ...shared, size: size, isIndeterminate: state.value === null });
    const caption = switchCaptionOf(state.value, labels);
    return (_jsxs(Switch, { ...shared, ...hooks.slot('switch', { indeterminate: state.value === null }), children: [_jsx("span", { ...hooks.slot('track'), "aria-hidden": "true", children: _jsx("span", { ...hooks.slot('thumb') }) }), caption ? _jsx("span", { ...hooks.slot('caption'), children: caption }) : null] }));
}
/** The control the variant draws, bound to the field state. Every pick commits at once. */
export function BooleanControl(props) {
    const Control = controls[props.variant];
    return _jsx(Control, { ...props });
}
//# sourceMappingURL=boolean-controls.js.map