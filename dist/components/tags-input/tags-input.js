import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { Field, useFieldControl } from '../field/field.js';
import { checkTag, hasTagDelimiter, resolveTagEntry } from './tag-entry.js';
import { TagsInputControl, tagsInputHooks as hooks } from './tags-input-parts.js';
const defaultDelimiters = [','];
/**
 * A field for a list of free-text values: typed text becomes a tag on Enter, on a delimiter or when
 * pasted as a list, and shows in the library's `TagGroup` before the input. A tag the field refuses
 * (past `maxValues`, a duplicate, or refused by `validateTag`) stays in the input and the field
 * shows why. It has the field base's label, validation, dirty state, restore, undo and menu.
 */
export function TagsInput({ placeholder, inputValue, onInputChange, delimiters = defaultDelimiters, maxValues, allowsDuplicates = false, validateTag, addOnBlur = false, ...props }) {
    const strings = useUiStrings();
    const rules = { delimiters, maxValues, allowsDuplicates, validateTag, strings };
    const [text, setText] = useControllableState(inputValue, '', onInputChange);
    const [attempt, setAttempt] = useState(null);
    // A refusal shows while the input still holds its text, checked against the current tags.
    const findRejection = (value) => attempt?.text === text ? checkTag(attempt.tag, value, rules) : null;
    const { state, field, rest } = useFieldControl(props, {
        initialValue: [],
        emptyValue: [],
        check: findRejection,
    });
    const rejection = findRejection(state.value);
    const enter = (entered, keepLast) => {
        if (state.isReadOnly || state.isDisabled)
            return;
        const result = resolveTagEntry(entered, { keepLast, value: state.value, rules });
        if (result.added.length > 0) {
            state.setValue([...state.value, ...result.added]);
            state.commit();
        }
        setText(result.inputValue);
        setAttempt(result.rejected === null ? null : { tag: result.rejected, text: result.inputValue });
        // A refused entry is an edit the reader made, so the field shows why whatever its mode.
        if (result.rejected !== null)
            state.revealValidation();
    };
    const entry = {
        text,
        type: (typed) => hasTagDelimiter(typed, delimiters) ? enter(typed, true) : setText(typed),
        enter: (entered) => enter(entered, false),
        splits: (pasted) => hasTagDelimiter(pasted, delimiters),
        addOnBlur,
    };
    return (_jsx(Field, { ...field, ...hooks.root({ className: field.className }), 
        // A required field left empty shows its own message first; a refusal is more recent.
        renderMessage: rejection ? () => rejection.message : field.renderMessage, state: state, children: (control) => (_jsx(TagsInputControl, { control: control, state: state, label: field.label, entry: entry, placeholder: placeholder, name: rest.name })) }));
}
//# sourceMappingURL=tags-input.js.map