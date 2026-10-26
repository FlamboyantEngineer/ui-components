import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { toErrorMessage } from '../../utils/to-error-message.js';
import { useEffect, useRef, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button, runPendingAction } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { SignatureDialog, } from '../signature-dialog/signature-dialog.js';
import { TextField } from '../text-field/text-field.js';
export const decisionControlHooks = createHooks('decision-control', [
    'form',
    'label',
    'choice',
    'comment',
    'error',
    'submit',
    'signature',
]);
const hooks = decisionControlHooks;
/** Submitting a decision: pending and failed while unsigned, through the signature dialog when signed. */
export function useDecisionSubmission({ details, isSigned, isDisabled, onSubmit, onSubmitted, }) {
    const strings = useUiStrings();
    const [isPending, setPending] = useState(false);
    const [isSigning, setSigning] = useState(false);
    const [error, setError] = useState(null);
    const running = useRef(false);
    useEffect(() => {
        if (isDisabled)
            setSigning(false);
    }, [isDisabled]);
    const submit = async (signature) => {
        if (isDisabled || running.current)
            return;
        running.current = true;
        try {
            await onSubmit({ ...details, signature });
            onSubmitted();
        }
        finally {
            running.current = false;
        }
    };
    const start = () => {
        if (isDisabled || running.current)
            return;
        if (isSigned) {
            setSigning(true);
            return;
        }
        setError(null);
        void runPendingAction({
            blocked: false,
            setPending,
            action: () => submit(null),
            onError: (reason) => setError(toErrorMessage(reason, strings.decisionFailed)),
        });
    };
    return { isPending, isSigning, setSigning, error, start, submit };
}
/** The signature dialog of a signed decision, stating the decision picked as its meaning. */
export function DecisionSignature({ signature, picked, comment, submission, }) {
    const strings = useUiStrings();
    return (_jsx(SignatureDialog, { isOpen: submission.isSigning, onOpenChange: submission.setSigning, title: strings.signDecision, userName: signature.userName, credentials: signature.credentials, drawing: signature.drawing, reason: "none", meanings: [{ id: picked.value, label: picked.label }], onSign: submission.submit, className: hooks.slotClass('signature'), children: comment.trim() ? comment : null }));
}
/**
 * The comment field, unless no decision asks for one: required by `comment`, or by the decision
 * picked.
 */
export function DecisionComment({ comment, options, picked, value, onChange, isDisabled, }) {
    const strings = useUiStrings();
    if (comment === 'none' && !options.some((option) => option.requiresComment))
        return null;
    return (_jsx(TextField, { label: strings.comment, multiline: true, isRequired: comment === 'required' || Boolean(picked?.requiresComment), isDisabled: isDisabled, value: value, onChange: onChange, className: hooks.slotClass('comment') }));
}
/** The failure of the last unsigned submission, then Submit. */
export function DecisionSubmit({ submission, label, isDisabled, }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [submission.error ? (_jsx(InlineError, { className: hooks.slotClass('error'), children: submission.error })) : null, _jsx(Button, { type: "submit", variant: "primary", isDisabled: isDisabled, isPending: submission.isPending, className: hooks.slotClass('submit'), children: label ?? strings.submitDecision })] }));
}
//# sourceMappingURL=decision-parts.js.map