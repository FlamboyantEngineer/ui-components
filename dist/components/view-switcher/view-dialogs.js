import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// The dialogs a view switcher opens from a view's actions: naming a view, and confirming a deletion.
import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';
/**
 * Names a new view or renames one: the name field starts from `label`, and Save, or Enter in the
 * field, submits the trimmed name, refused while blank; a returned promise keeps the dialog pending
 * until it settles and open with the failure if it rejects.
 */
function NameViewDialog({ dialog, onClose, }) {
    const strings = useUiStrings();
    const [draft, setDraft] = useState(null);
    const name = (draft ?? dialog?.label ?? '').trim();
    const submit = async () => {
        await dialog?.onSubmit(name);
        onClose();
    };
    return (_jsx(Modal, { isOpen: dialog?.isOpen ?? false, onOpenChange: (open) => {
            if (!open)
                onClose();
        }, onExitComplete: () => setDraft(null), title: dialog?.type === 'rename' ? strings.renameView : strings.newView, primaryAction: { label: strings.save, isDisabled: !name, onPress: submit }, children: ({ runPrimaryAction }) => (_jsx(TextField, { label: strings.viewName, value: draft ?? dialog?.label ?? '', onChange: setDraft, onKeyDown: (event) => {
                // Control+Enter is the modal's own shortcut for the same action.
                if (event.key !== 'Enter' || event.ctrlKey || event.metaKey)
                    return;
                if (!event.nativeEvent.isComposing)
                    runPrimaryAction();
            }, isRequired: true, autoFocus: true })) }));
}
/** The view switcher's open dialog: naming a view, or confirming a view's deletion. */
export function ViewDialogs({ dialog, onClose }) {
    const strings = useUiStrings();
    const deletion = dialog?.type === 'delete' ? dialog : null;
    return (_jsxs(_Fragment, { children: [_jsx(NameViewDialog, { dialog: dialog?.type === 'delete' ? null : dialog, onClose: onClose }), _jsx(Modal, { role: "alertdialog", isOpen: deletion?.isOpen ?? false, onOpenChange: (open) => {
                    if (!open)
                        onClose();
                }, tone: "danger", title: strings.deleteViewTitle(deletion?.label ?? ''), description: strings.deleteViewMessage, cancelAction: { autoFocus: true }, primaryAction: {
                    label: strings.delete,
                    onPress: async (close) => {
                        await deletion?.onSubmit();
                        close();
                    },
                } })] }));
}
//# sourceMappingURL=view-dialogs.js.map