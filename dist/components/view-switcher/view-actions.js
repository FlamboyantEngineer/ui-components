import { joinMenuGroups } from '../menu/menu.js';
/** Save, save as and reset: they act on the current settings, so only on the selected view. */
function listSettingsActions(key, context) {
    const { handlers, strings, isDirty } = context;
    if (key !== context.selectedKey)
        return [];
    const entries = [];
    const { onSave, onSaveAs, onReset } = handlers;
    if (onSave && isDirty) {
        entries.push({ id: 'save', label: strings.save, icon: 'save', onAction: () => onSave(key) });
    }
    if (onSaveAs) {
        entries.push({
            id: 'save-as',
            label: strings.saveViewAs,
            icon: 'plus',
            onAction: () => context.openDialog({ type: 'save-as', label: '', isOpen: true, onSubmit: onSaveAs }),
        });
    }
    if (onReset && isDirty) {
        entries.push({
            id: 'reset',
            label: strings.resetView,
            icon: 'undo',
            onAction: () => onReset(key),
        });
    }
    return entries;
}
/** The menu entries of a view's actions: its settings, its name and default, then deletion. */
export function listViewActions(key, label, context) {
    const { handlers, strings, openDialog } = context;
    const { onRename, onDefaultViewChange, onDelete } = handlers;
    const naming = [];
    if (onRename) {
        naming.push({
            id: 'rename',
            label: strings.rename,
            icon: 'edit',
            onAction: () => openDialog({
                type: 'rename',
                label,
                isOpen: true,
                onSubmit: (name) => onRename(key, name),
            }),
        });
    }
    if (onDefaultViewChange && key !== context.defaultViewKey) {
        naming.push({
            id: 'set-default',
            label: strings.setDefaultView,
            icon: 'star',
            onAction: () => onDefaultViewChange(key),
        });
    }
    const removal = onDelete
        ? [
            {
                id: 'delete',
                label: strings.delete,
                icon: 'delete',
                tone: 'danger',
                isDisabled: !context.canDelete,
                onAction: () => openDialog({ type: 'delete', label, isOpen: true, onSubmit: () => onDelete(key) }),
            },
        ]
        : [];
    return joinMenuGroups([listSettingsActions(key, context), naming, removal]);
}
//# sourceMappingURL=view-actions.js.map