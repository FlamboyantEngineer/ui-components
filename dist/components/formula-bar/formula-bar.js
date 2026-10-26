import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useLayoutEffect, useRef, useState, } from 'react';
import { Input } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { formatCellReference, parseCellReference, } from '../../utils/cell-reference.js';
import { CodeEditor } from '../code-editor/code-editor.js';
import { Button } from '../button/button.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
const hooks = createHooks('formula-bar', [
    'reference',
    'status',
    'cancel',
    'confirm',
    'glyph',
    'editor',
    'result',
]);
const describeSource = (cell, value) => cell ? `${cell.row}:${cell.column}:${value}` : '';
/** Whether a cell lies inside the grid's bounds, where they are known. */
function isInGrid(cell, bounds) {
    return cell.row < (bounds.rowCount ?? Infinity) && cell.column < (bounds.columnCount ?? Infinity);
}
/** The state of one source: the value set for it, or the initial one. */
function useSourceState(source, initial) {
    const [state, setState] = useState({ source, value: initial });
    return [state.source === source ? state.value : initial, (value) => setState({ source, value })];
}
/** The reference box: the active cell's reference, which the reader edits to move to another. */
function FormulaBarReference({ cell, onCellChange, rowCount, columnCount, isDisabled, }) {
    const strings = useUiStrings();
    const reference = cell ? formatCellReference(cell) : '';
    const [typed, setTyped] = useSourceState(reference, null);
    const [refused, setRefused] = useSourceState(reference, null);
    const inputRef = useRef(null);
    const isSelectPending = useRef(false);
    // After Enter or Escape the box selects what it then shows, so typing replaces it.
    useLayoutEffect(() => {
        if (!isSelectPending.current)
            return;
        isSelectPending.current = false;
        inputRef.current?.select();
    });
    const onKeyDown = (event) => {
        if (event.key === 'Escape') {
            setTyped(null);
            setRefused(null);
        }
        else if (event.key === 'Enter' && typed !== null) {
            const target = parseCellReference(typed);
            if (target && isInGrid(target, { rowCount, columnCount })) {
                setTyped(null);
                onCellChange?.(target);
            }
            else
                setRefused(typed);
        }
        else
            return;
        event.preventDefault();
        isSelectPending.current = true;
    };
    return (_jsxs(_Fragment, { children: [_jsx(Input, { ref: inputRef, ...hooks.slot('reference', { invalid: refused !== null }), "aria-label": strings.formulaCellReference, "aria-invalid": refused !== null || undefined, value: typed ?? reference, disabled: isDisabled, spellCheck: false, autoComplete: "off", onChange: (event) => {
                    setTyped(event.target.value);
                    setRefused(null);
                }, onFocus: (event) => event.target.select(), onBlur: () => {
                    setTyped(null);
                    setRefused(null);
                }, onKeyDown: onKeyDown }), _jsx(VisuallyHidden, { elementType: "span", className: hooks.slotClass('status'), role: "status", children: refused === null ? '' : strings.formulaInvalidReference(refused) })] }));
}
/** The buttons that restore and commit the content, enabled while it differs from the cell's. */
function FormulaBarButtons(props) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsx(Button, { icon: "close", size: "sm", label: strings.cancel, className: hooks.slotClass('cancel'), isDisabled: !props.isDirty, onPress: props.onCancel }), _jsx(Button, { icon: "check", size: "sm", label: strings.confirm, className: hooks.slotClass('confirm'), isDisabled: !props.canCommit, onPress: props.onConfirm })] }));
}
/**
 * A bar above a spreadsheet grid: the active cell's A1 reference, which the reader edits to move
 * to another cell, and the cell's raw content on one line of `CodeEditor`, highlighted by the
 * caller's tokenizer. Enter or the confirm button commits the content, Escape or the cancel button
 * restores it, and the caller's evaluation shows the result; the library evaluates nothing.
 */
export function FormulaBar({ cell, value, onCommit, onCellChange, rowCount, columnCount, tokenize, completions, evaluate, placeholder, isReadOnly = false, isDisabled = false, className, ...rest }) {
    const strings = useUiStrings();
    const resultId = useId();
    const [draft, setDraft] = useSourceState(describeSource(cell, value), null);
    const text = draft ?? value;
    const isDirty = draft !== null && draft !== value;
    const isLocked = isDisabled || cell === null;
    const commit = () => {
        if (cell && !isReadOnly)
            onCommit?.(text, cell);
    };
    const cancel = () => setDraft(null);
    const onKeyDown = (event) => {
        if (event.nativeEvent.isComposing)
            return;
        if (event.key === 'Enter')
            commit();
        else if (event.key === 'Escape' && isDirty)
            cancel();
        else
            return;
        event.preventDefault();
    };
    const labelledBy = rest['aria-labelledby'];
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { dirty: isDirty, disabled: isLocked } }), "aria-label": rest['aria-label'] ?? (labelledBy ? undefined : strings.formulaBar), role: "group", children: [_jsx(FormulaBarReference, { cell: cell, onCellChange: onCellChange, rowCount: rowCount, columnCount: columnCount, isDisabled: isDisabled }), _jsx(FormulaBarButtons, { isDirty: isDirty, canCommit: isDirty && !isReadOnly, onCancel: cancel, onConfirm: commit }), _jsx(Glyph, { name: "formula", className: hooks.slotClass('glyph') }), _jsx(CodeEditor, { variant: "surface", className: hooks.slotClass('editor'), "aria-label": strings.formulaCellContent, "aria-describedby": evaluate && cell ? resultId : undefined, multiline: false, value: text, onChange: setDraft, tokenize: tokenize, completions: completions, placeholder: placeholder, isReadOnly: isReadOnly, isDisabled: isLocked, onKeyDown: onKeyDown }), evaluate && cell ? (_jsxs("span", { ...hooks.slot('result'), id: resultId, children: [_jsx(VisuallyHidden, { elementType: "span", children: strings.formulaResult }), ' ', evaluate(text, cell)] })) : null] }));
}
//# sourceMappingURL=formula-bar.js.map