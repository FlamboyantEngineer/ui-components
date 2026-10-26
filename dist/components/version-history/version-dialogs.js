import { jsx as _jsx } from "react/jsx-runtime";
// The dialogs a version history opens from a version's menu: confirming a restore, and naming.
import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';
/** Confirms bringing a version back as the current one before `onAction` restores it. */
export function RestoreVersionDialog({ target, isOpen, onClose, onAction, }) {
    const strings = useUiStrings();
    return (_jsx(Modal, { role: "alertdialog", isOpen: isOpen, onOpenChange: (open) => {
            if (!open)
                onClose();
        }, title: strings.restoreVersionTitle(target?.title ?? ''), description: strings.restoreVersionMessage, cancelAction: { autoFocus: true }, primaryAction: {
            label: strings.restore,
            onPress: async (close) => {
                if (target)
                    await onAction(target.key);
                close();
            },
        } }));
}
/**
 * Names a version, or renames it. Saving a changed name (trimmed; empty removes the name) calls
 * `onAction` and closes the dialog; saving the same name only closes it. Enter in the field saves
 * through the dialog's action, so it is pending until a returned promise settles and shows a failure.
 */
export function RenameVersionDialog({ target, isOpen, onClose, onAction, }) {
    const strings = useUiStrings();
    const [draft, setDraft] = useState(null);
    const label = target?.label ?? '';
    const value = draft !== null && draft.key === target?.key ? draft.value : label;
    const save = async () => {
        const trimmed = value.trim();
        if (target && trimmed !== label)
            await onAction(target.key, trimmed);
        onClose();
    };
    return (_jsx(Modal, { isOpen: isOpen, onOpenChange: (open) => {
            if (!open)
                onClose();
        }, onExitComplete: () => setDraft(null), title: label === '' ? strings.nameVersion : strings.renameVersion, primaryAction: { label: strings.save, onPress: save }, children: ({ runPrimaryAction }) => (_jsx(TextField, { label: strings.versionName, value: value, onChange: (next) => {
                if (target)
                    setDraft({ key: target.key, value: next });
            }, onKeyDown: (event) => {
                // Control+Enter is the modal's own shortcut for the same action.
                if (event.key !== 'Enter' || event.ctrlKey || event.metaKey)
                    return;
                if (!event.nativeEvent.isComposing)
                    runPrimaryAction();
            }, autoFocus: true })) }));
}
//# sourceMappingURL=version-dialogs.js.map