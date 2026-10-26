import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button as AriaButton, Input, TextField } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { ColorSwatch } from '../color-swatch/color-swatch.js';
import { toAriaControlProps } from '../field/field.js';
import { colorFieldHooks as hooks } from './color-field-panel.js';
import { formatColor, storeColorText } from './color-values.js';
/**
 * The typeable closed control: a swatch button that opens the picker, then a text input showing the
 * colour in its format. Typed text applies when focus leaves the input and commits on Enter, or once
 * focus leaves the field: a colour in any CSS form sets the value, empty text clears an optional
 * one, and anything else is put back.
 */
export function ColorEntry({ control, state, label, color, format, valueFormat, placeholder, }) {
    const strings = useUiStrings();
    const [draft, setDraft] = useState(null);
    // Leaving the input only applies the text: the field commits once focus leaves it, so Tab
    // reaches its restore button.
    const apply = ({ shouldCommit }) => {
        if (draft === null)
            return;
        setDraft(null);
        const typed = storeColorText(draft, valueFormat);
        const isCleared = typed === null && !draft.trim() && state.canClear;
        if (typed === null && !isCleared)
            return;
        state.setValue(typed);
        if (shouldCommit)
            state.commit();
    };
    return (_jsxs("div", { ...hooks.slot('group'), children: [_jsx(AriaButton, { ...hooks.slot('trigger'), "aria-label": strings.colorPicker(label), isDisabled: control.disabled || control.readOnly, children: _jsx(ColorSwatch, { color: color, size: "sm", className: hooks.slotClass('swatch') }) }), _jsx(TextField, { ...toAriaControlProps(control), className: hooks.slotClass('entry'), value: draft ?? (color ? formatColor(color, format) : ''), onChange: setDraft, onBlur: () => apply({ shouldCommit: false }), onKeyDown: (event) => {
                    if (event.key === 'Enter')
                        apply({ shouldCommit: true });
                    else if (event.key === 'Escape' && draft !== null)
                        setDraft(null);
                    else
                        event.continuePropagation();
                }, children: _jsx(Input, { ...hooks.slot('input'), ref: control.ref, placeholder: placeholder }) })] }));
}
//# sourceMappingURL=color-field-entry.js.map