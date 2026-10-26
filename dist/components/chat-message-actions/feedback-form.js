import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { TextField } from '../text-field/text-field.js';
import { actionHooks } from './message-actions-bar.js';
/** The details that follow a rating: reason chips, an optional comment, then Skip and Submit. */
export function FeedbackForm({ reasons, onSubmit, onSkip }) {
    const strings = useUiStrings();
    const [chosen, setChosen] = useState(new Set());
    const [comment, setComment] = useState('');
    const toggle = (reason, isChosen) => setChosen((current) => {
        const next = new Set(current);
        if (isChosen)
            next.add(reason);
        else
            next.delete(reason);
        return next;
    });
    return (_jsxs(_Fragment, { children: [reasons.length > 0 ? (_jsx("div", { ...actionHooks.slot('reasons'), role: "group", "aria-label": strings.feedbackReasons, children: reasons.map((reason) => (_jsx(Button, { variant: "chip", size: "sm", className: actionHooks.slotClass('reason'), isSelected: chosen.has(reason), onChange: (isChosen) => toggle(reason, isChosen), children: reason }, reason))) })) : null, _jsx(TextField, { label: strings.feedbackComment, multiline: true, value: comment, committedValue: comment, onChange: setComment, className: actionHooks.slotClass('comment') }), _jsxs("div", { ...actionHooks.slot('feedback-actions'), children: [_jsx(Button, { size: "sm", onPress: onSkip, children: strings.skip }), _jsx(Button, { size: "sm", variant: "primary", onPress: () => onSubmit({ reasons: reasons.filter((reason) => chosen.has(reason)), comment }), children: strings.submitFeedback })] })] }));
}
//# sourceMappingURL=feedback-form.js.map