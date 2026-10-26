import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TextField as AriaTextField } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { isAutoGrowing } from '../../utils/use-auto-grow.js';
import { ControlCompletionList, } from '../completion-list/completion-list.js';
import { Field, countCodePoints, toAriaControlProps, useFieldControl, validateString, } from '../field/field.js';
import { TextFieldControl, TextFieldFrame, textFieldHooks as hooks, withCharacterCount, } from './text-field-parts.js';
import { useTextFieldInput } from './use-text-field-input.js';
/** The character count: the text as the length rules check it (trimmed with `trim`), by `getLength`. */
function countCharacters(value, { trim, getLength }) {
    return (getLength ?? countCodePoints)(trim ? value.trim() : value);
}
/** The input shows the display value, so the value submits under the form name through a hidden input. */
function HiddenValue({ name, state }) {
    if (!name)
        return null;
    return _jsx("input", { type: "hidden", name: name, value: state.value, disabled: state.isDisabled });
}
/** The completion list under the text field element, when the field offers completions. */
function TextFieldCompletions({ edit, renderCompletion, }) {
    if (!edit.completion)
        return null;
    return (_jsx(ControlCompletionList, { model: edit.completion.model, listId: edit.completion.listId, anchorRef: edit.boxRef, renderCompletion: renderCompletion, className: hooks.slotClass('completions') }));
}
/**
 * A field for a plain string, on one line or several. It validates its length and format, commits
 * when focus leaves the field and on Enter, and reverts an edit on Escape. Adornments and a reveal button sit inside the
 * input's frame; a counter joins the description.
 */
export function TextField({ minLength, maxLength, pattern, trim, getLength, multiline = false, placeholder, startAdornment, endAdornment, allowsReveal = false, minRows, maxRows, showCount = false, spellCheck, transformInput, displayValue, completions, renderCompletion, onKeyDown, ...props }) {
    const strings = useUiStrings();
    const rules = { minLength, maxLength, pattern, trim, getLength };
    const { state, field, rest } = useFieldControl(props, {
        initialValue: '',
        emptyValue: '',
        check: (value) => validateString(value, rules, strings),
    });
    const [isRevealed, setIsRevealed] = useState(false);
    const input = { placeholder, transformInput, displayValue, onKeyDown, completions };
    const edit = useTextFieldInput({ state, multiline, ...input });
    const isMasked = allowsReveal && rest.type === 'password';
    const count = showCount ? countCharacters(state.value, rules) : null;
    const autosize = multiline && isAutoGrowing({ minRows, maxRows });
    const data = { multiline, autosize, displayValue: edit.showsDisplayValue };
    const reveal = isMasked
        ? { label: field.label, isRevealed, isDisabled: state.isDisabled, onChange: setIsRevealed }
        : null;
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className, data }), description: withCharacterCount(field.description, { count, maxLength }), state: state, commitOnBlur: true, children: (control) => (_jsxs(_Fragment, { children: [_jsx(AriaTextField, { ...rest, ...toAriaControlProps(control), ...hooks.slot('box'), ref: edit.boxRef, name: displayValue === undefined ? rest.name : undefined, spellCheck: spellCheck?.toString(), type: isMasked && isRevealed ? 'text' : rest.type, value: edit.text, onChange: edit.onChange, children: _jsx(TextFieldFrame, { startAdornment: startAdornment, endAdornment: endAdornment, reveal: reveal, children: _jsx(TextFieldControl, { multiline, minRows, maxRows, input: edit.input, value: edit.text, controlRef: mergeRefs(control.ref, edit.transform.ref, edit.controlRef) }) }) }), _jsx(TextFieldCompletions, { edit: edit, renderCompletion: renderCompletion }), displayValue === undefined ? null : _jsx(HiddenValue, { name: rest.name, state: state })] })) }));
}
//# sourceMappingURL=text-field.js.map