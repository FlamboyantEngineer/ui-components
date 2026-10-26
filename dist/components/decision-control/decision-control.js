import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { Form } from '../form/form.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { DecisionComment, DecisionSignature, DecisionSubmit, decisionControlHooks as hooks, useDecisionSubmission, } from './decision-parts.js';
function defaultOptions(strings) {
    return [
        { value: 'approve', label: strings.approve, icon: 'check' },
        { value: 'reject', label: strings.reject, icon: 'close', requiresComment: true },
    ];
}
/**
 * The reader's own decision: a choice of decisions (approve or reject, or the scores of a vote) on
 * a `SegmentedChoice`, a comment that is optional, required, or required by the decision picked,
 * and Submit. With `signature`, Submit confirms through a `SignatureDialog` first.
 */
export function DecisionControl({ label, options, value, defaultValue = null, onChange, comment = 'optional', signature, submitLabel, onSubmit, isDisabled = false, className, ...rest }) {
    const strings = useUiStrings();
    const labelId = useId();
    const choices = options ?? defaultOptions(strings);
    const [decision, setDecision] = useControllableState(value, defaultValue, onChange);
    const [commentText, setCommentText] = useState('');
    const picked = choices.find((option) => option.value === decision);
    const submission = useDecisionSubmission({
        details: { decision: picked?.value ?? '', comment: commentText },
        isSigned: signature !== undefined,
        isDisabled,
        onSubmit,
        onSubmitted: () => setCommentText(''),
    });
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest }), "data-decision": picked?.value, "data-pending": submission.isPending ? 'true' : undefined, children: [_jsxs(Form, { className: hooks.slotClass('form'), "aria-labelledby": labelId, onSubmit: (event) => {
                    event.preventDefault();
                    if (picked)
                        submission.start();
                }, children: [_jsx("span", { ...hooks.slot('label'), id: labelId, children: label ?? strings.yourDecision }), _jsx(SegmentedChoice, { "aria-labelledby": labelId, options: choices.map(({ requiresComment: _requiresComment, ...option }) => option), value: decision, onChange: setDecision, isDisabled: isDisabled, sizing: "content", className: hooks.slotClass('choice') }), _jsx(DecisionComment, { comment: comment, options: choices, picked: picked, value: commentText, onChange: setCommentText, isDisabled: isDisabled }), _jsx(DecisionSubmit, { submission: submission, label: submitLabel, isDisabled: isDisabled || !picked })] }), signature && picked && !isDisabled ? (_jsx(DecisionSignature, { signature: signature, picked: picked, comment: commentText, submission: submission })) : null] }));
}
//# sourceMappingURL=decision-control.js.map