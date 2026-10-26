import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useRef } from 'react';
import { ComboBox as AriaComboBox, FieldError, Label, Text } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { decodeComboboxValue, encodeComboboxItems, useComboboxValues } from './combobox-values.js';
import { useChipsLabel } from './combobox-chips.js';
import { ComboboxField, ComboboxInputs } from './combobox-field.js';
import { flattenOptions } from './combobox-options.js';
import { useComboboxModel, useInlineCompletionState, } from './combobox-state.js';
import { ComboboxSuggestions } from './combobox-suggestions.js';
const hooks = createHooks('combobox', ['label', 'description', 'error']);
/** What the chips of a multiple combobox need: the text naming their group, and the options. */
function toChips(label, suggestions) {
    return { label, options: flattenOptions(suggestions) };
}
/** The props React Aria's `ComboBox` takes as given: all but the suggestions and the open state. */
function omitModelProps(props) {
    const { items, defaultItems, loadItems, minSearchLength, searchDelay, onLoadMore, isLoading, renderEmptyState, isOpen, defaultOpen, onOpenChange, onInputChange, ...aria } = props;
    return aria;
}
function ComboboxLabel({ label, labelRef }) {
    return label ? (_jsx(Label, { ref: labelRef, className: hooks.slotClass('label'), children: label })) : null;
}
function ComboboxMessages({ description, errorMessage, }) {
    return (_jsxs(_Fragment, { children: [description ? (_jsx(Text, { slot: "description", className: hooks.slotClass('description'), children: description })) : null, _jsx(FieldError, { className: hooks.slotClass('error'), children: errorMessage })] }));
}
/**
 * A text input with a list of suggestions (React Aria `ComboBox`): typed freely when
 * `allowsCustomValue`, or completed from the list; several options may be picked as chips.
 */
export function Combobox({ label, description, errorMessage, placeholder, isPending = false, variant = 'default', size = 'md', className, allowsEmptyCollection = true, isDisabled, isReadOnly, completesInline, listHeader, inputRef, onChange, virtualized, onCreateOption, highlightMatches, autoHighlight, renderOption, name, ...rest }) {
    const aria = omitModelProps(rest);
    const values = useComboboxValues(aria.value, aria.defaultValue);
    const model = useComboboxModel({ ...rest, isPending, isDisabled, isReadOnly });
    const suggestions = useMemo(() => encodeComboboxItems(model.suggestions), [model.suggestions]);
    const inline = useInlineCompletionState({ completesInline, suggestions });
    const [input, setInput] = useForwardedRef(inputRef);
    const createdRef = useRef(null);
    const isMultiple = aria.selectionMode === 'multiple';
    const naming = useChipsLabel({ label, aria, isEnabled: isMultiple });
    const list = { virtualized, onCreateOption, highlightMatches, autoHighlight, renderOption };
    return (_jsxs(AriaComboBox, { ...aria, ...values, onChange: onChange ? (next) => onChange(decodeComboboxValue(next)) : undefined, name: aria.allowsCustomValue ? name : undefined, ...hooks.root({ className, props: aria, data: { variant, size, pending: model.isPending } }), ...(model.isControlled ? { items: suggestions } : { defaultItems: suggestions }), defaultFilter: inline.defaultFilter, onInputChange: model.input.onInputChange, onOpenChange: model.onOpenChange, isDisabled: isDisabled, isReadOnly: isReadOnly, allowsEmptyCollection: allowsEmptyCollection, children: [_jsx(ComboboxLabel, { label: label, labelRef: naming.labelRef }), _jsx(ComboboxField, { variant: variant, size: size, placeholder: placeholder, isPending: model.isPending, isEditable: !isDisabled && !isReadOnly, chips: isMultiple ? toChips(naming.text, model.suggestions) : null, completion: inline.field, input: { ref: input, setRef: setInput } }), _jsx(ComboboxMessages, { description: description, errorMessage: errorMessage }), _jsx(ComboboxInputs, { name: name, isDisabled: isDisabled, isCustom: aria.allowsCustomValue }), _jsx(ComboboxSuggestions, { ...list, size: size, items: suggestions, loading: model.loading, inputText: model.input.text, completion: inline.completion, createdRef: createdRef, renderEmpty: model.renderEmpty, listHeader: listHeader, inputRef: input, isOpen: model.isOpen })] }));
}
//# sourceMappingURL=combobox.js.map