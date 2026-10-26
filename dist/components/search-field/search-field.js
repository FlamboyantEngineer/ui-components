import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { ButtonContext, FieldError, Group, Input, Label, SearchField as AriaSearchField, Text, } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button, ButtonSpinner } from '../button/button.js';
const hooks = createHooks('search-field', [
    'label',
    'group',
    'glyph',
    'input',
    'spinner',
    'clear',
    'description',
    'error',
]);
/**
 * The clear button. React Aria's own clear button is left out of the tab order and moves focus as a
 * press starts, which a keyboard press cannot survive, so this one stays outside its context.
 */
function ClearButton({ label, text, onPress }) {
    const shared = { className: hooks.slotClass('clear'), size: 'xs', onPress };
    return (_jsx(ButtonContext.Provider, { value: null, children: text ? (_jsx(Button, { ...shared, variant: "ghost", "aria-label": label, children: text })) : (_jsx(Button, { ...shared, icon: "close", label: label })) }));
}
/** The parts inside the box's frame: the glyph, the input, the spinner and the clear button. */
function SearchBox({ input, placeholder, isPending, onClear, clearLabel, clearText, }) {
    return (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "search", className: hooks.slotClass('glyph') }), _jsx(Input, { ...hooks.slot('input'), ref: input, placeholder: placeholder }), isPending ? _jsx(ButtonSpinner, { className: hooks.slotClass('spinner') }) : null, onClear ? _jsx(ClearButton, { label: clearLabel, text: clearText, onPress: onClear }) : null] }));
}
/**
 * A search or filter box: a search glyph, the query input, a spinner while results load and a clear
 * button while it holds text. Escape clears the query and Enter submits it. In the `label-control`
 * layout it also draws its label, description and error message around the box.
 */
export function SearchField({ label, placeholder, clearLabel, clearText, size = 'md', labelLayout = 'control-only', description, errorMessage, isPending = false, inputRef, className, onClear, spellCheck, ...rest }) {
    const strings = useUiStrings();
    const ownInput = useRef(null);
    const input = inputRef ?? ownInput;
    const hasLabel = labelLayout === 'label-control';
    const data = { size, labelLayout, pending: isPending };
    return (_jsx(AriaSearchField, { ...rest, ...hooks.root({ className, props: rest, data }), "aria-label": hasLabel ? undefined : label, spellCheck: spellCheck?.toString(), onClear: onClear, children: ({ isEmpty, isDisabled, isReadOnly, state }) => {
            const clear = () => {
                input.current?.focus();
                state.setValue('');
                onClear?.();
            };
            const box = (_jsx(SearchBox, { input: input, placeholder: placeholder, isPending: isPending, onClear: isEmpty || isDisabled || isReadOnly ? null : clear, clearLabel: clearLabel ?? strings.clearSearch, clearText: clearText }));
            if (!hasLabel)
                return box;
            return (_jsxs(_Fragment, { children: [_jsx(Label, { ...hooks.slot('label'), children: label }), _jsx(Group, { ...hooks.slot('group'), role: "presentation", children: box }), description ? (_jsx(Text, { ...hooks.slot('description'), slot: "description", children: description })) : null, _jsx(FieldError, { ...hooks.slot('error'), children: errorMessage })] }));
        } }));
}
//# sourceMappingURL=search-field.js.map