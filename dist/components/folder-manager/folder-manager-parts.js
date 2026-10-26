import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
export const folderManagerHooks = createHooks('folder-manager', [
    'toolbar',
    'filter',
    'tree',
    'name-input',
    'message',
    'load-error',
]);
const hooks = folderManagerHooks;
function ToolButton({ action, icon, label, }) {
    if (!action.isOffered)
        return null;
    return (_jsx(Button, { icon: icon, label: label, size: "sm", isDisabled: action.isDisabled, focusableWhenDisabled: Boolean(action.reason), tooltip: action.reason ?? label, onPress: action.onPress }));
}
/**
 * The name field of a folder being created or renamed. The folder manager reads its keys: Enter
 * submits the name and Escape abandons the edit.
 */
export function FolderNameInput({ edit, messageId, inputRef, onBlur }) {
    const strings = useUiStrings();
    return (_jsx(Input, { className: hooks.slotClass('name-input'), ref: inputRef, "aria-label": edit.kind === 'create' ? strings.newFolderName : strings.renameItem(edit.original), "aria-invalid": messageId ? true : undefined, "aria-describedby": messageId, "aria-busy": edit.isPending || undefined, defaultValue: edit.name, readOnly: edit.isPending, autoFocus: true, onFocus: (event) => event.currentTarget.select(), onBlur: (event) => onBlur(event.currentTarget.value) }));
}
/** New folder, Rename and Delete, acting on the selected folder. */
export function FolderToolbar({ create, rename, remove }) {
    const strings = useUiStrings();
    if (!create.isOffered && !rename.isOffered && !remove.isOffered)
        return null;
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [_jsx(ToolButton, { action: create, icon: "plus", label: strings.newFolder }), _jsx(ToolButton, { action: rename, icon: "edit", label: strings.rename }), _jsx(ToolButton, { action: remove, icon: "delete", label: strings.delete })] }));
}
//# sourceMappingURL=folder-manager-parts.js.map