import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Input } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl, } from '../field/field.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { SignatureSurface, signaturePadHooks as hooks } from './signature-surface.js';
function modeOf(value) {
    return value.kind === 'typed' ? 'type' : 'draw';
}
/** The name input of the typed mode: blank text is no signature. */
function SignatureInput({ control, state }) {
    const strings = useUiStrings();
    const { value } = state;
    return (_jsx(Input, { ...control, ...hooks.slot('input'), autoComplete: "name", placeholder: strings.signatureTypePlaceholder, value: value?.kind === 'typed' ? value.text : '', onChange: (event) => {
            const text = event.target.value;
            state.setValue(text.trim() === '' ? null : { kind: 'typed', text });
        }, onKeyDown: (event) => {
            if (event.key === 'Enter')
                state.commit();
        } }));
}
function SignatureControls({ control, state, mode, onModeChange, name }) {
    const strings = useUiStrings();
    const { value } = state;
    const isEditable = !state.isReadOnly && !state.isDisabled;
    return (_jsxs(_Fragment, { children: [onModeChange ? (_jsx(SegmentedChoice, { ...hooks.slot('modes'), "aria-label": strings.signatureMethod, size: "sm", sizing: "content", options: [
                    { value: 'draw', label: strings.signatureDraw },
                    { value: 'type', label: strings.signatureType },
                ], value: mode, isReadOnly: state.isReadOnly, isDisabled: state.isDisabled, onChange: (next) => {
                    if (next === 'draw' || next === 'type')
                        onModeChange(next);
                } })) : null, mode === 'type' ? (_jsx(SignatureInput, { control: control, state: state })) : (_jsx(SignatureSurface, { control: control, drawing: value?.kind === 'drawn' ? value : null, isEditable: isEditable, onDraw: (drawing) => {
                    state.setValue(drawing);
                    state.commit();
                } })), name ? (_jsx("input", { type: "hidden", name: name, value: value ? JSON.stringify(value) : '', disabled: state.isDisabled })) : null] }));
}
/**
 * A field for a signature: drawn with a mouse, a pen or a touch as smoothed strokes on an SVG
 * canvas, with Undo stroke and Clear, or typed as the signer's name, the keyboard alternative. The
 * value is a drawn signature (SVG path data) or a typed one, and `null` while empty. It has the
 * field base's label, validation, dirty state, restore, undo and menu.
 */
export function SignaturePad({ allowsTyping = true, ...props }) {
    const { state, field, rest } = useFieldControl(props, { initialValue: null, emptyValue: null });
    const valueMode = state.value ? modeOf(state.value) : null;
    const [chosenMode, setChosenMode] = useState(valueMode ?? 'draw');
    // An empty field keeps the mode of the value it last held, so clearing a typed name keeps its input.
    if (valueMode && valueMode !== chosenMode)
        setChosenMode(valueMode);
    const mode = valueMode ?? chosenMode;
    const changeMode = (next) => {
        setChosenMode(next);
        if (state.value && modeOf(state.value) !== next) {
            state.setValue(null);
            state.commit();
        }
    };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, data: { mode } }), state: state, commitOnBlur: true, children: (control) => (_jsx(SignatureControls, { control: control, state: state, mode: mode, onModeChange: allowsTyping ? changeMode : null, name: rest.name })) }));
}
//# sourceMappingURL=signature-pad.js.map