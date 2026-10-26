import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useLayoutEffect, useRef, } from 'react';
import { Button as AriaButton, ComboBoxStateContext, Group, Input, } from '../../primitives/index.js';
import { fromCollectionKey } from '../../utils/from-collection-key.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ComboboxChips } from './combobox-chips.js';
import { findCompletion, } from './combobox-options.js';
const hooks = createHooks('combobox', [
    'field',
    'search-icon',
    'input',
    'spinner',
    'clear',
    'button',
]);
/**
 * Empties the input and, for a single combobox, the selection, then returns focus to the input. A
 * multiple combobox keeps its chips, which have their own remove buttons.
 */
function ClearButton({ inputRef }) {
    const state = useContext(ComboBoxStateContext);
    const strings = useUiStrings();
    if (!state || state.inputValue === '')
        return null;
    return (_jsx(Button, { slot: null, icon: "close", label: strings.clear, variant: "bare", size: "sm", className: hooks.slotClass('clear'), 
        // Pressing keeps focus in the input, so an open list neither closes nor reverts the text
        // under the pointer, which would take the button away mid-press.
        preventFocusOnPress: true, onPress: () => {
            if (!Array.isArray(state.value))
                state.setSelectedKey(null);
            state.setInputValue('');
            inputRef.current?.focus();
        } }));
}
/**
 * Completes typed text with the first option starting with it and selects the added part, so the
 * next keystroke replaces it. Only insertions complete; deleting text never brings it back.
 */
function useInlineCompletion(completion, inputRef) {
    const state = useContext(ComboBoxStateContext);
    const pending = useRef(null);
    useLayoutEffect(() => {
        const input = inputRef.current;
        const selection = pending.current;
        if (!input || !selection || input.value !== selection.text)
            return;
        pending.current = null;
        input.setSelectionRange(selection.start, selection.text.length);
    });
    if (!completion || !state)
        return undefined;
    return (event) => {
        const native = event.nativeEvent;
        const typed = event.target.value;
        const found = native.inputType?.startsWith('insert') && !native.isComposing
            ? findCompletion(completion.options, typed)
            : null;
        completion.onComplete(found);
        if (!found)
            return;
        pending.current = { text: found.text, start: typed.length };
        state.setInputValue(found.text);
    };
}
/** The field group: chips, the search glyph, the input, the busy indicator and the buttons. */
export function ComboboxField({ variant, size, placeholder, isPending, isEditable, chips, completion, input, }) {
    const onChange = useInlineCompletion(completion, input.ref);
    return (_jsxs(Group, { className: hooks.slotClass('field'), children: [chips === null ? null : (_jsx(ComboboxChips, { ...chips, size: size === 'xs' ? 'sm' : size, isEditable: isEditable })), variant === 'search' ? (_jsx(Glyph, { name: "search", className: hooks.slotClass('search-icon') })) : null, _jsx(Input, { ref: input.setRef, className: hooks.slotClass('input'), placeholder: placeholder, "aria-busy": isPending || undefined, "aria-autocomplete": completion ? 'both' : undefined, onChange: onChange }), isPending ? _jsx("span", { ...hooks.slot('spinner'), "aria-hidden": "true" }) : null, isEditable ? _jsx(ClearButton, { inputRef: input.ref }) : null, _jsx(AriaButton, { className: hooks.slotClass('button'), children: _jsx(Glyph, { name: "chevron-down" }) })] }));
}
/** Submits original keys while collection primitives use their encoded identities. */
export function ComboboxInputs({ name, isDisabled, isCustom, }) {
    const state = useContext(ComboBoxStateContext);
    if (!name || isCustom)
        return null;
    const keys = Array.isArray(state?.value) ? state.value : [state?.value ?? ''];
    return keys.map((key) => (_jsx("input", { type: "hidden", name: name, value: String(fromCollectionKey(key)), disabled: isDisabled }, String(key))));
}
//# sourceMappingURL=combobox-field.js.map