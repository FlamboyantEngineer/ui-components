import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useContext, useLayoutEffect, useRef, useState } from 'react';
import { Input, TableStateContext } from '../../primitives/index.js';
import { getColumnText } from './table-column.js';
import { tableHooks as hooks } from './table-hooks.js';
import { readCellText } from './table-cell-writes.js';
import { getCellValue, isTextValue, } from './table-rows.js';
/** The text a cell's editor starts with: the cell's text or number. */
function formatEditorText(value) {
    return isTextValue(value) ? String(value) : '';
}
/** Hands the arrow keys, Home, End and type-ahead to the editor while it is open. */
function useKeyboardNavigationLock() {
    const state = useContext(TableStateContext);
    useLayoutEffect(() => {
        state?.setKeyboardNavigationDisabled(true);
        return () => state?.setKeyboardNavigationDisabled(false);
    }, [state]);
}
/** Ends the edit of an Escape key, keeping the key from the grid. */
function handleEscape(event, cancel) {
    if (event.key !== 'Escape')
        return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
}
/** Where a commit key moves focus in spreadsheet mode: Enter down, Tab along, Shift back. */
function getCommitMove(event, movesOnCommit) {
    if (!movesOnCommit)
        return undefined;
    if (event.key === 'Tab')
        return event.shiftKey ? 'start' : 'end';
    return event.shiftKey ? 'up' : 'down';
}
/**
 * A text input that commits on Enter and when focus leaves it, and cancels on Escape. A value the
 * column refuses keeps the editor open with its message; leaving then drops the text.
 */
function DefaultCellEditor(props) {
    const { label, read, movesOnCommit } = props;
    const [text, setText] = useState(props.initialText);
    const [error, setError] = useState(null);
    // Leaving the document fires blur too: only the first way out counts.
    const isDone = useRef(false);
    const commit = (event) => {
        event.preventDefault();
        const reading = read(text);
        setError(reading.error);
        if (reading.error !== null || isDone.current)
            return;
        isDone.current = true;
        props.onCommit(reading.value, getCommitMove(event, movesOnCommit));
    };
    const release = () => {
        if (isDone.current)
            return;
        isDone.current = true;
        const reading = read(text);
        if (reading.error === null)
            props.onRelease(reading.value);
        else
            props.onDismiss();
    };
    return (_jsxs(_Fragment, { children: [_jsx(Input, { ...hooks.slot('editor', { invalid: error !== null }), "aria-label": label, "aria-invalid": error !== null || undefined, value: text, autoFocus: true, onChange: (event) => setText(event.target.value), onKeyDown: (event) => {
                    if (event.key === 'Enter' || (event.key === 'Tab' && movesOnCommit))
                        commit(event);
                    handleEscape(event, () => {
                        isDone.current = true;
                        props.onCancel();
                    });
                }, onBlur: release }), error === null ? null : (_jsx("span", { ...hooks.slot('editor-message'), role: "alert", children: error }))] }));
}
/**
 * The editor of the cell being edited: the column's own editor, or a text input. Escape cancels;
 * while it is open the grid's arrow-key navigation is off so the editor keeps its keys.
 */
export function TableCellEditorView({ row, column, editing, movesOnCommit, }) {
    useKeyboardNavigationLock();
    const value = getCellValue(row, column);
    const label = getColumnText(column);
    const toEdit = (next) => ({ row, columnId: column.id, value: next });
    const editor = {
        value,
        label,
        commit: (next) => editing.commit(toEdit(next)),
        cancel: editing.cancel,
    };
    if (column.renderEditor) {
        return (_jsx("span", { onKeyDown: (event) => handleEscape(event, editing.cancel), children: column.renderEditor(row, editor) }));
    }
    return (_jsx(DefaultCellEditor, { initialText: editing.editing?.text ?? formatEditorText(value), label: label, read: (text) => readCellText(row, column, text), onCommit: (next, move) => editing.commit(toEdit(next), move), onRelease: (next) => editing.release(toEdit(next)), onCancel: editing.cancel, onDismiss: editing.dismiss, movesOnCommit: movesOnCommit }));
}
//# sourceMappingURL=table-cell-editor.js.map