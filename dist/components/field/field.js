import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { isEmptyValue } from '../../utils/is-empty-value.js';
import { useCallback, useState } from 'react';
import { createSlotRegistry } from '../../utils/slot-registry.js';
import { FieldContextMenu, FieldMenuButton, useFieldMenu, } from './field-menu.js';
import { FieldHelp, FieldLabel, FieldMessage, fieldHooks as hooks, toFieldControlProps, toInnerControlSize, useFieldIds, } from './field-parts.js';
import { useFieldFocus } from './field-focus.js';
import { useFieldFormBinding } from './field-form.js';
import { FieldRestoreButton } from './field-restore-button.js';
import { useFieldUndo } from './field-undo.js';
/** Focus in the field: leaving it touches the field and, with `commitOnBlur`, commits first. */
function useFieldLeave(state, slots, commitOnBlur) {
    return useFieldFocus({
        getRoot: () => slots.read('root'),
        getControl: () => slots.read('control'),
        onLeave: () => {
            if (commitOnBlur)
                state.commit();
            state.touch();
        },
    });
}
/** Puts the committed value back; the button leaves with it, so keyboard focus moves to the control first. */
function restoreField(state, slots) {
    slots.read('control')?.focus();
    state.restore();
}
/** The states the root publishes from the field state. */
function toFieldStates(state) {
    return {
        validation: state.validation.status,
        dirty: state.isDirty,
        required: state.isRequired,
        readonly: state.isReadOnly,
        disabled: state.isDisabled,
        touched: state.isTouched,
        filled: !isEmptyValue(state.value),
    };
}
/** The buttons after the control, one size below the field: restore while dirty, help and menu. */
function FieldButtons({ label, size, help, menu, onRestore, }) {
    return (_jsxs(_Fragment, { children: [onRestore ? _jsx(FieldRestoreButton, { label: label, size: size, onPress: onRestore }) : null, help ? (_jsx(FieldHelp, { id: help.id, label: label, size: size, children: help.content })) : null, menu ? (_jsx(FieldMenuButton, { model: menu, size: size, className: hooks.slotClass('menu') })) : null] }));
}
/**
 * Lays out a field around its control: the label, the control, the restore, help and menu buttons,
 * the host's decoration, the description and the validation message. It gives the control its ids
 * and ARIA, applies undo and redo chords pressed inside it, registers its undo for `getFieldUndo`
 * and takes part in an enclosing form.
 */
export function Field({ state, label, labelLayout = 'label-control', size = 'md', description, help, decoration, menu = [], onMenuAction, renderMessage, commitOnBlur = false, children, className, id, ...rest }) {
    const ids = useFieldIds(id);
    const [slots] = useState(() => createSlotRegistry());
    const getRoot = useCallback(() => slots.read('root'), [slots]);
    const onKeyDown = useFieldUndo(getRoot, state);
    const focus = useFieldLeave(state, slots, commitOnBlur);
    useFieldFormBinding(state, slots, label);
    const menuModel = useFieldMenu(state, label, { menu, onMenuAction });
    const hasLabel = labelLayout !== 'control-only';
    const control = toFieldControlProps(state, ids, {
        ref: slots.ref('control'),
        label: hasLabel ? undefined : label,
        hasDescription: Boolean(description),
        hasDecoration: Boolean(decoration),
    });
    const labelElement = hasLabel ? (_jsx(FieldLabel, { ids: ids, label: label, layout: labelLayout, isRequired: state.isRequired })) : null;
    const data = {
        labelLayout,
        size,
        ...toFieldStates(state),
        focused: focus.isFocused,
    };
    return (_jsx(FieldContextMenu, { model: menuModel, children: _jsxs("div", { ...hooks.root({ className, props: rest, data }), id: id, ref: slots.ref('root'), onKeyDown: onKeyDown, onFocus: focus.onFocus, onBlur: focus.onBlur, children: [labelLayout === 'control-label' ? null : labelElement, _jsx("div", { ...hooks.slot('control'), children: children(control) }), labelLayout === 'control-label' ? labelElement : null, _jsx(FieldButtons, { label: label, size: toInnerControlSize(size), help: help ? { id: ids.help, content: help } : null, menu: menu.length > 0 ? menuModel : null, onRestore: state.isDirty ? () => restoreField(state, slots) : null }), decoration ? (_jsx("div", { ...hooks.slot('decoration'), id: ids.decoration, children: decoration })) : null, description ? (_jsx("div", { ...hooks.slot('description'), id: ids.description, children: description })) : null, _jsx(FieldMessage, { id: ids.message, validation: state.validation, children: renderMessage ? renderMessage(state.validation, state.issues) : state.validation.message })] }) }));
}
export { toAriaControlProps, useFieldControl } from './field-control.js';
export { FieldPreviousValue } from './field-previous-value.js';
export { FieldRestoreButton } from './field-restore-button.js';
export { useFieldState } from './field-state.js';
export { FieldScopeContext, useFieldScope } from './field-scope.js';
export { Fieldset } from './fieldset.js';
export { getFieldUndo } from './field-undo.js';
export { countCodePoints, validateString } from './string-rules.js';
//# sourceMappingURL=field.js.map