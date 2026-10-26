import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { isEmptyValue } from '../../utils/is-empty-value.js';
import { useId } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { TextField } from '../text-field/text-field.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { useInlineEdit } from './use-inline-edit.js';
const hooks = createHooks('inline-edit', [
    'read',
    'value',
    'placeholder',
    'icon',
    'editor',
    'control',
    'actions',
    'save',
    'cancel',
    'error',
]);
/** The default editor: a one-line text field named by the label. */
function renderTextEditor({ value, onChange, label, isPending }) {
    const text = String(value ?? '');
    return (_jsx(TextField, { label: label, labelLayout: "control-only", value: text, 
        // The draft is the field's committed value, so the field never shows its own dirty state.
        committedValue: text, onChange: (next) => onChange(next), isPending: isPending }));
}
/** The save and cancel buttons after the editor. */
function InlineEditActions({ isPending, onSave, onCancel, }) {
    const strings = useUiStrings();
    return (_jsxs("span", { ...hooks.slot('actions'), children: [_jsx(Button, { icon: "check", label: strings.save, size: "sm", variant: "secondary", className: hooks.slotClass('save'), isPending: isPending, onPress: onSave }), _jsx(Button, { icon: "close", label: strings.cancel, size: "sm", variant: "secondary", className: hooks.slotClass('cancel'), isDisabled: isPending, onPress: onCancel })] }));
}
/**
 * A value read in place that turns into its editor where it stands: a click, Enter, Space or F2 on
 * the read view opens the editor; Enter or focus leaving it saves, and Escape cancels. A save may be
 * asynchronous: the editor stays open and pending until it settles, and shows why it failed.
 */
export function InlineEdit(props) {
    const { value, label, renderValue, renderEditor = renderTextEditor, placeholder } = props;
    const { showActions = false, isDisabled = false, className, id, ...rest } = props;
    const strings = useUiStrings();
    const nameId = useId();
    const valueId = `${nameId}-value`;
    const edit = useInlineEdit({
        value,
        onSave: props.onSave,
        isEditing: props.isEditing,
        defaultEditing: props.defaultEditing ?? false,
        onEditingChange: props.onEditingChange,
        failureMessage: strings.saveFailed,
    });
    const isEmpty = isEmptyValue(value);
    const data = {
        editing: edit.isEditing,
        pending: edit.isPending,
        invalid: edit.error !== null,
        empty: isEmpty,
        disabled: isDisabled,
    };
    return (_jsx("div", { id: id, ...hooks.root({ className, props: rest, data }), children: edit.isEditing ? (_jsxs("div", { ref: edit.editorRef, ...hooks.slot('editor'), ...edit.editorHandlers, children: [_jsx("div", { ...hooks.slot('control'), children: renderEditor({
                        value: edit.current,
                        onChange: edit.setCurrent,
                        commit: edit.commit,
                        cancel: edit.cancel,
                        label,
                        isPending: edit.isPending,
                    }) }), showActions ? (_jsx(InlineEditActions, { isPending: edit.isPending, onSave: () => edit.commit(), onCancel: edit.cancel })) : null, edit.error === null ? null : (_jsx(InlineError, { className: hooks.slotClass('error'), children: edit.error }))] })) : (_jsxs(AriaButton, { ref: edit.readRef, className: hooks.slotClass('read'), "aria-labelledby": `${nameId} ${valueId}`, isDisabled: isDisabled, onPress: edit.open, onKeyDown: (event) => {
                if (event.key === 'F2')
                    edit.open();
                else
                    event.continuePropagation();
            }, children: [_jsx(VisuallyHidden, { elementType: "span", id: nameId, children: strings.editValue(label) }), isEmpty ? (_jsx("span", { id: valueId, ...hooks.slot('placeholder'), children: placeholder })) : (_jsx("span", { id: valueId, ...hooks.slot('value'), children: renderValue ? renderValue(value) : String(value) })), isDisabled ? null : _jsx(Glyph, { name: "edit", className: hooks.slotClass('icon') })] })) }));
}
//# sourceMappingURL=inline-edit.js.map