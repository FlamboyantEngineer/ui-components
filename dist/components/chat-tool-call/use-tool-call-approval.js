import { useRef, useState } from 'react';
import { useFocusRequest } from '../../utils/use-focus-request.js';
function isCommandEnter(event) {
    return event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.altKey;
}
/**
 * The approval's state and keys. While the call waits for a decision and focus is in the card,
 * Ctrl+Enter or Cmd+Enter approves (or sends the denial while its form is open) and Escape
 * focuses Deny (or cancels the open form). The keys are caught before the focused control sees
 * them, so a focused button is not pressed too; Escape on Deny itself goes on to the page.
 */
export function useToolCallApproval({ isPending, onApprove, onDeny, }) {
    const [isOpen, setIsOpen] = useState(false);
    const [reason, setReason] = useState('');
    const denyRef = useRef(null);
    const requestFocus = useFocusRequest();
    // A decision made elsewhere closes the form and forgets its reason, so a later request starts clean.
    if (isOpen && !isPending) {
        setIsOpen(false);
        setReason('');
    }
    const isDenying = isOpen && isPending && onDeny !== undefined;
    const closeDenyForm = () => {
        setIsOpen(false);
        setReason('');
        requestFocus(() => denyRef.current);
    };
    const sendDenial = () => {
        const trimmed = reason.trim();
        closeDenyForm();
        onDeny?.(trimmed === '' ? undefined : trimmed);
    };
    const runKey = (event) => {
        if (isCommandEnter(event)) {
            if (isDenying)
                sendDenial();
            else if (onApprove)
                onApprove();
            else
                return false;
            return true;
        }
        if (event.key !== 'Escape' || !onDeny)
            return false;
        if (isDenying)
            closeDenyForm();
        else if (event.target === denyRef.current)
            return false;
        else
            denyRef.current?.focus();
        return true;
    };
    const onKeyDownCapture = (event) => {
        if (!isPending || event.nativeEvent.isComposing || !runKey(event))
            return;
        event.preventDefault();
        event.stopPropagation();
    };
    return {
        isDenying,
        reason,
        setReason,
        denyRef,
        openDenyForm: () => setIsOpen(true),
        closeDenyForm,
        sendDenial,
        onKeyDownCapture,
    };
}
//# sourceMappingURL=use-tool-call-approval.js.map