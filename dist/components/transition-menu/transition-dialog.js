import { jsx as _jsx } from "react/jsx-runtime";
// The dialog a transition opens before it runs: a confirmation, a required comment, or both.
import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Modal } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';
/**
 * Asks before a transition runs: its message and, when the transition requires one, a comment that
 * must not be blank. The action runs the transition, keeping the dialog pending until a returned
 * promise settles and open with the failure if it rejects.
 */
export function TransitionDialog({ target, isOpen, onClose, onConfirm, commentClassName, }) {
    const strings = useUiStrings();
    const [comment, setComment] = useState('');
    const requiresComment = target?.requiresComment ?? false;
    return (_jsx(Modal, { isOpen: isOpen, onOpenChange: (open) => {
            if (!open)
                onClose();
        }, onExitComplete: () => setComment(''), title: strings.transitionTo(target?.state ?? ''), description: target?.message, primaryAction: {
            label: target?.action ?? '',
            isDisabled: requiresComment && comment.trim() === '',
            onPress: async (close) => {
                await onConfirm(requiresComment ? comment.trim() : undefined);
                close();
            },
        }, children: requiresComment ? (_jsx(TextField, { className: commentClassName, label: strings.comment, multiline: true, isRequired: true, value: comment, onChange: setComment, autoFocus: true })) : null }));
}
//# sourceMappingURL=transition-dialog.js.map