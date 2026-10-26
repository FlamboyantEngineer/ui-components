import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useImperativeHandle, useRef, useState } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Form } from '../form/form.js';
import { Choice, ChoiceGroup } from '../choice-group/choice-group.js';
import { SignaturePad } from '../signature-pad/signature-pad.js';
import { TextField } from '../text-field/text-field.js';
export const signatureDialogHooks = createHooks('signature-dialog', [
    'summary',
    'form',
    'meaning',
    'signer',
]);
const hooks = signatureDialogHooks;
/** The meaning: stated when there is one, chosen from radios when there are several. */
function MeaningChoice({ meanings, value, onChange, }) {
    const strings = useUiStrings();
    const [only] = meanings;
    if (only && meanings.length === 1) {
        return (_jsxs("p", { ...hooks.slot('meaning'), children: [strings.signatureMeaning, ": ", only.label] }));
    }
    return (_jsx(ChoiceGroup, { label: strings.signatureMeaning, isRequired: true, value: value, onChange: onChange, children: meanings.map((meaning) => (_jsx(Choice, { value: toKeyIdentity(meaning.id), description: meaning.description, children: meaning.label }, toKeyIdentity(meaning.id)))) }));
}
/** Who signs, then the user name when it is asked and the password. */
function SignerCredentials({ userName, typedUserName, password, onUserNameChange, onPasswordChange, }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [_jsx("p", { ...hooks.slot('signer'), children: strings.signingAs(userName) }), typedUserName === null ? null : (_jsx(TextField, { label: strings.userName, autoComplete: "username", isRequired: true, value: typedUserName, onChange: onUserNameChange })), _jsx(TextField, { label: strings.password, type: "password", autoComplete: "current-password", isRequired: true, value: password, onChange: onPasswordChange })] }));
}
/**
 * The entries of a signature: the meaning, the reason, the drawn signature and the credentials, in
 * a form whose submit validation runs when the dialog's Sign action asks. The credentials live only
 * here, so they leave with the dialog, and a failed signing clears the password.
 */
export function SignatureForm({ userName, credentials, meanings, reason, drawing, onSign, submitRef, }) {
    const strings = useUiStrings();
    const form = useRef(null);
    const isValid = useRef(false);
    const [typedUserName, setTypedUserName] = useState('');
    const [password, setPassword] = useState('');
    const [meaning, setMeaning] = useState(meanings.length === 1 ? toKeyIdentity(meanings[0].id) : null);
    const [reasonText, setReasonText] = useState('');
    const [signature, setSignature] = useState(null);
    useImperativeHandle(submitRef, () => (close) => {
        isValid.current = false;
        form.current?.requestSubmit();
        const chosen = meanings.find((entry) => toKeyIdentity(entry.id) === meaning);
        if (!isValid.current || !chosen)
            return undefined;
        const details = {
            userName: credentials === 'username-password' ? typedUserName : userName,
            password,
            meaning: chosen.id,
            reason: reasonText,
            signature,
        };
        return Promise.resolve()
            .then(() => onSign(details))
            .then(close, (error) => {
            setPassword('');
            throw error;
        });
    });
    return (_jsxs(Form, { ...hooks.slot('form'), ref: form, validationBehavior: "aria", onSubmit: (event) => {
            event.preventDefault();
            isValid.current = true;
        }, children: [_jsx(MeaningChoice, { meanings: meanings, value: meaning, onChange: setMeaning }), reason === 'none' ? null : (_jsx(TextField, { label: strings.signatureReason, multiline: true, isRequired: reason === 'required', value: reasonText, onChange: setReasonText })), drawing === 'none' ? null : (_jsx(SignaturePad, { label: strings.signature, isRequired: drawing === 'required', value: signature, onChange: setSignature })), _jsx(SignerCredentials, { userName: userName, typedUserName: credentials === 'username-password' ? typedUserName : null, password: password, onUserNameChange: setTypedUserName, onPasswordChange: setPassword })] }));
}
//# sourceMappingURL=signature-form.js.map