import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
import { mergeClassNames } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Modal } from '../modal/modal.js';
import { SignatureForm, signatureDialogHooks as hooks, } from './signature-form.js';
/**
 * A modal confirmation that binds the signer to an action: what is signed, the meaning of the
 * signature, an optional reason and drawn signature, and the signer's password asked again. Sign
 * validates the entries, then hands them to `onSign`; the dialog closes when it succeeds and shows
 * its error when it fails. The credentials are never kept: they leave with the dialog.
 */
export function SignatureDialog({ children, userName, credentials = 'password', meanings, reason = 'optional', drawing = 'none', confirmLabel, onSign, className, ...rest }) {
    const strings = useUiStrings();
    const submit = useRef(null);
    return (_jsxs(Modal, { ...rest, className: mergeClassNames(hooks.className, className), primaryAction: {
            label: confirmLabel ?? strings.sign,
            onPress: (close) => submit.current?.(close),
        }, children: [isEmptyNode(children) ? null : _jsx("div", { ...hooks.slot('summary'), children: children }), _jsx(SignatureForm, { userName: userName, credentials: credentials, meanings: meanings, reason: reason, drawing: drawing, onSign: onSign, submitRef: submit })] }));
}
//# sourceMappingURL=signature-dialog.js.map