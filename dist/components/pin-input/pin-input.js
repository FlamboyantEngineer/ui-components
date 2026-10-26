import { jsx as _jsx } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { PinInputCells, pinInputHooks as hooks } from './pin-input-cells.js';
/**
 * A field for a short code, such as a PIN or a one-time code: one single-character input per
 * character, in a group named by the label. Typing advances, Backspace erases and moves back, the
 * arrow keys move, and a paste fills the cells from the focused one. It has the field base's
 * validation, dirty state, restore, undo and menu, and reports a partly filled code.
 */
export function PinInput({ length, type = 'numeric', mask = false, placeholder, autoComplete = 'off', onComplete, ...props }) {
    const strings = useUiStrings();
    const { state, field, rest } = useFieldControl(props, {
        initialValue: '',
        emptyValue: '',
        check: (value) => value !== '' && value.length < length
            ? { severity: 'error', message: strings.tooShort(length), validity: 'tooShort' }
            : null,
    });
    return (_jsx(Field, { ...field, ...hooks.root({
            className: field.className,
            data: { complete: state.value.length >= length },
        }), state: state, commitOnBlur: true, children: (control) => (_jsx(PinInputCells, { control: control, state: state, cells: { length, type, mask, placeholder, autoComplete }, name: rest.name, onComplete: onComplete })) }));
}
//# sourceMappingURL=pin-input.js.map