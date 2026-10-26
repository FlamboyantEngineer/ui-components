import { jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from './modal.js';
import { TextField } from '../text-field/text-field.js';
import { ModalConfirmation } from './modal-confirm.js';
function AlertDialog({ options, isOpen, onOpenChange, close, }) {
    const strings = useUiStrings();
    return (_jsx(ModalConfirmation, { tone: "info", confirmLabel: strings.ok, ...options, cancelLabel: null, isOpen: isOpen, onOpenChange: onOpenChange, onConfirm: async () => {
            await options.onConfirm?.();
            close();
        } }));
}
function PromptDialog({ options, isOpen, onOpenChange, close, }) {
    const strings = useUiStrings();
    const { title, message, label, defaultValue = '', confirmLabel, cancelLabel } = options;
    const [text, setText] = useState(defaultValue);
    // Enter answers the prompt, as in the browser's own; Control+Enter runs the action as in any modal.
    const onKeyDown = (event) => {
        if (event.key === 'Enter' && !event.nativeEvent.isComposing)
            close(text);
    };
    return (_jsx(Modal, { title: title, description: message, isOpen: isOpen, onOpenChange: onOpenChange, cancelAction: { label: cancelLabel }, primaryAction: { label: confirmLabel ?? strings.ok, onPress: () => close(text) }, children: _jsx(TextField, { label: label, defaultValue: defaultValue, onChange: setText, onKeyDown: onKeyDown, autoFocus: true }) }));
}
/**
 * Opens an alert through `controller`: a `ModalConfirmation` (tone `info` by default) whose one action,
 * labelled by the provider's `ok` string, acknowledges it. Resolves once it closes, however it closes.
 */
export function alert(controller, options) {
    const handle = controller.open({
        render: (entry) => _jsx(AlertDialog, { ...entry, options: options }),
    });
    return handle.result.then(() => undefined);
}
/**
 * Opens a dialog through `controller` that asks for one line of text, and resolves to the text when
 * the reader confirms (the action or Enter), or `null` when they cancel or dismiss it.
 */
export function prompt(controller, options) {
    const handle = controller.open({
        render: (entry) => _jsx(PromptDialog, { ...entry, options: options }),
    });
    return handle.result.then((value) => value ?? null);
}
//# sourceMappingURL=modal-prompts.js.map