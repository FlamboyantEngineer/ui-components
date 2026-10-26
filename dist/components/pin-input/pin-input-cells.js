import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useMemo, useRef, useState, } from 'react';
import { Group, Input, useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { clamp } from '../../utils/clamp.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { createSlotRegistry } from '../../utils/slot-registry.js';
import { filterPinCharacters, findActivePinCell, readEnteredText, writePinCharacters, } from './pin-value.js';
export const pinInputHooks = createHooks('pin-input', ['group', 'cell']);
const hooks = pinInputHooks;
/**
 * The arrow keys, Home and End move between cells; Backspace erases and moves back; typing the
 * character a cell already holds moves on, as no change event follows it.
 */
function handleCellKey(event, cell) {
    const { index, value } = cell;
    const step = cell.isRtl ? -1 : 1;
    const moves = {
        ArrowLeft: index - step,
        ArrowRight: index + step,
        Home: 0,
        End: cell.active,
    };
    const target = moves[event.key];
    const isRetyped = event.key === value[index] && !event.ctrlKey && !event.metaKey && !event.altKey;
    if (target === undefined && event.key !== 'Backspace' && !isRetyped)
        return;
    event.preventDefault();
    if (target !== undefined)
        cell.focusCell(target);
    else if (event.key === 'Backspace' && cell.isEditable)
        cell.erase(index);
    else if (isRetyped)
        cell.focusCell(index + 1);
}
/** What the field gives every cell: its description and its states. */
function toCellControlProps(control) {
    return {
        'aria-describedby': control['aria-describedby'],
        'aria-errormessage': control['aria-errormessage'],
        'aria-invalid': control['aria-invalid'],
        'aria-required': control['aria-required'],
        readOnly: control.readOnly,
        disabled: control.disabled,
    };
}
/**
 * Changes the value and moves focus once the new value has rendered, when the tab order and the
 * cell that takes the next character follow it. Focus moves only while it is still in the group
 * and the value did change, so a change the caller ignores moves nothing later. A value that fills
 * every cell commits, and `onComplete` receives the value the caller renders once it is complete,
 * once per new complete value.
 */
function useCellWriter(state, options) {
    const { slots, length, onComplete } = options;
    const pendingFocus = useRef(null);
    useLayoutEffect(() => {
        const pending = pendingFocus.current;
        pendingFocus.current = null;
        const group = slots.read('group');
        const isInside = group?.contains(group.ownerDocument.activeElement) ?? false;
        if (!pending || pending.from === state.value)
            return;
        if (isInside)
            slots.readAll('cell')[pending.index]?.focus();
        if (state.value.length >= length)
            onComplete?.(state.value);
    });
    return (next, focusIndex) => {
        if (next === state.value) {
            slots.readAll('cell')[focusIndex]?.focus();
            return;
        }
        pendingFocus.current = { index: focusIndex, from: state.value };
        state.setValue(next);
        if (next.length >= length)
            state.commit();
    };
}
/**
 * The cells of a code, one input each, in a group named by the field's label. One cell is in the
 * tab order, and focus never lands past the cell that takes the next character, so the value has
 * no gaps. A hidden input submits the joined value.
 */
export function PinInputCells({ control, state, cells, name, onComplete }) {
    const { length, type } = cells;
    const strings = useUiStrings();
    const { direction } = useLocale();
    const [slots] = useState(() => createSlotRegistry());
    const firstRef = useMemo(() => mergeRefs(control.ref, slots.refAt('cell', 0)), [control.ref, slots]);
    const write = useCellWriter(state, { slots, length, onComplete });
    const { value } = state;
    const active = findActivePinCell(value, length);
    const isEditable = !state.isReadOnly && !state.isDisabled;
    const focusCell = (index) => slots.readAll('cell')[clamp(index, 0, active)]?.focus();
    const fill = (index, text) => {
        const characters = filterPinCharacters(text, type);
        if (characters === '' || !isEditable)
            return;
        const next = writePinCharacters(value, { index, characters, length });
        write(next, Math.min(index + characters.length, length - 1));
    };
    const erase = (index) => {
        const target = index < value.length ? index : index - 1;
        if (target >= 0)
            write(value.slice(0, target) + value.slice(target + 1), Math.max(index - 1, 0));
    };
    const keys = { value, active, isRtl: direction === 'rtl', isEditable, focusCell, erase };
    // One cell is in the tab order: the focused one, else the active one, never past the active one.
    const [focused, setFocused] = useState(null);
    const tabbable = Math.min(focused ?? active, active);
    const cellControl = toCellControlProps(control);
    return (_jsxs(_Fragment, { children: [_jsx(Group, { ...hooks.slot('group'), ref: slots.ref('group'), "aria-label": control['aria-label'], "aria-labelledby": control['aria-labelledby'], isDisabled: state.isDisabled, isInvalid: control['aria-invalid'], isReadOnly: state.isReadOnly, 
                // The field commits once focus leaves it, so Tab reaches its restore button.
                onBlur: (event) => {
                    if (!event.currentTarget.contains(event.relatedTarget))
                        setFocused(null);
                }, children: Array.from({ length }, (_, index) => (_jsx(Input, { ...hooks.slot('cell', { filled: index < value.length }), ref: index === 0 ? firstRef : slots.refAt('cell', index), id: index === 0 ? control.id : undefined, type: cells.mask ? 'password' : 'text', inputMode: type === 'numeric' ? 'numeric' : 'text', autoComplete: index === 0 ? cells.autoComplete : 'off', "aria-label": strings.characterPosition(index + 1, length), ...cellControl, placeholder: cells.placeholder, tabIndex: index === tabbable ? 0 : -1, value: value[index] ?? '', onChange: (event) => fill(index, readEnteredText(event.target.value, value[index] ?? '')), onPaste: (event) => {
                        event.preventDefault();
                        fill(index, event.clipboardData.getData('text/plain'));
                    }, onKeyDown: (event) => handleCellKey(event, { ...keys, index }), onFocus: (event) => {
                        if (index > active)
                            return focusCell(active);
                        setFocused(index);
                        event.currentTarget.select();
                    } }, index))) }), name ? _jsx("input", { type: "hidden", name: name, value: value, disabled: state.isDisabled }) : null] }));
}
//# sourceMappingURL=pin-input-cells.js.map