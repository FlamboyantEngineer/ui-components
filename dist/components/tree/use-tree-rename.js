import { jsx as _jsx } from "react/jsx-runtime";
// Renaming a row in place: F2 swaps its label for a text field, Enter or leaving the field renames
// the row, and Escape keeps the old name.
import { useMemo, useRef, useState, } from 'react';
import { Input } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { treeHooks as hooks } from './tree-hooks.js';
function TreeRenameInput(props) {
    const strings = useUiStrings();
    return (_jsx(Input, { ref: props.inputRef, className: hooks.slotClass('rename-input'), "aria-label": strings.renameItem(props.name), defaultValue: props.name, autoFocus: true, onFocus: (event) => event.currentTarget.select(), onBlur: props.onBlur }));
}
/**
 * Renaming rows in place: F2 on a row the owner lets rename (`canRename`, every row by default)
 * opens a name field holding the text value. Enter and leaving the field report a changed, non-blank
 * name through `onRename`; Escape abandons it. Enter and Escape return focus to the row.
 */
export function useTreeRename(options) {
    const { onRename, canRename, getTextValue } = options;
    const [editing, setEditing] = useState(null);
    const editingRef = useRef(null);
    const inputRef = useRef(null);
    return useMemo(() => {
        if (!onRename)
            return null;
        const finish = (isCommit) => {
            const item = editingRef.current;
            if (!item)
                return;
            editingRef.current = null;
            setEditing(null);
            const name = inputRef.current?.value.trim() ?? '';
            if (isCommit && name !== '' && name !== getTextValue(item))
                onRename(item, name);
        };
        return {
            editingKey: editing?.id ?? null,
            start(item) {
                if (canRename && !canRename(item))
                    return false;
                editingRef.current = item;
                setEditing(item);
                return true;
            },
            isEditorEvent: (event) => event.target === inputRef.current,
            onEditorKeyDown(event) {
                event.stopPropagation();
                if (event.key !== 'Enter' && event.key !== 'Escape')
                    return;
                event.preventDefault();
                const row = inputRef.current?.closest('[role="row"]');
                finish(event.key === 'Enter');
                row?.focus();
            },
            renderEditor: (item) => (_jsx(TreeRenameInput, { name: getTextValue(item), inputRef: inputRef, onBlur: () => finish(true) })),
        };
    }, [editing, onRename, canRename, getTextValue]);
}
//# sourceMappingURL=use-tree-rename.js.map