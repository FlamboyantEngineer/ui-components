import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLayoutEffect, useRef, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { InlineError } from '../inline-error/inline-error.js';
import { QuestionItem } from './chat-question-item.js';
import { chatQuestionHooks as hooks, emptyDraft, isQuestionAnswered, toAnswer, } from './chat-question-model.js';
import { QuestionTabs } from './chat-question-tabs.js';
/** Focuses a question's answer: the chosen radio, else its first radio, checkbox or text field. */
function focusAnswer(element) {
    const target = element?.querySelector('input[type="radio"]:checked') ??
        element?.querySelector('input:not([type="hidden"])');
    target?.focus();
}
/** A primary button that stays focusable while unavailable, with a hint saying why. */
function PrimaryAction({ slot, label, hint, isAvailable, isDisabled, isPending, onPress, }) {
    return (_jsx(Button, { className: hooks.slotClass(slot), variant: "primary", isDisabled: !isAvailable || isDisabled, isPending: isPending, focusableWhenDisabled: true, tooltip: isAvailable ? undefined : hint, onPress: onPress, children: label }));
}
/**
 * Back (after the first question), Next or, on the last question, Submit when the card can be
 * answered, then Dismiss when it can be dismissed. While a request runs, its button is pending and
 * the others are unavailable.
 */
function QuestionActions(props) {
    const { step, count, canStep, isComplete, running, onStep, onSubmit, onDismiss } = props;
    const strings = useUiStrings();
    const isLast = step >= count - 1;
    if (step === 0 && isLast && !onSubmit && !onDismiss)
        return null;
    return (_jsxs("div", { ...hooks.slot('actions'), children: [step > 0 ? (_jsx(Button, { className: hooks.slotClass('back'), isDisabled: running !== null, onPress: () => onStep(step - 1), children: strings.back })) : null, isLast ? null : (_jsx(PrimaryAction, { slot: "next", label: strings.next, hint: strings.questionAnswerToContinue, isAvailable: canStep, isDisabled: running !== null, onPress: () => onStep(step + 1) })), isLast && onSubmit ? (_jsx(PrimaryAction, { slot: "submit", label: strings.questionSubmit, hint: strings.questionAnswerAllToSubmit, isAvailable: isComplete, isDisabled: running === 'dismiss', isPending: running === 'submit', onPress: onSubmit })) : null, onDismiss ? (_jsx(Button, { className: hooks.slotClass('dismiss'), variant: "ghost", isDisabled: running === 'submit', isPending: running === 'dismiss', onPress: onDismiss, children: strings.dismiss })) : null] }));
}
/**
 * A pending card: its questions as tabs with a counter, the shown question, the reader's drafts,
 * Back, Next, Submit and Dismiss, and why the last request failed. Any tab shows its question and
 * keeps focus; Back and Next move focus to the answer of the question they show; Enter in an answer
 * field steps on, or submits from the last question. Without `onSubmit`, or while a request runs,
 * the answers are read-only; a read-only card steps through its questions without answers.
 */
export function PendingQuestions(props) {
    const { questions, onSubmit, onDismiss, running, failure, answeredMark } = props;
    const [drafts, setDrafts] = useState({});
    const [step, setStep] = useState(0);
    const [revealed, setRevealed] = useState(() => new Set());
    const itemRef = useRef(null);
    const hasStepped = useRef(false);
    useLayoutEffect(() => {
        if (!hasStepped.current)
            return;
        hasStepped.current = false;
        focusAnswer(itemRef.current);
    }, [step]);
    const current = questions[step];
    const canAnswer = onSubmit !== undefined && running === null;
    const firstOpen = questions.findIndex((item) => !isQuestionAnswered(item, drafts[item.id]));
    const isStepAnswered = current ? isQuestionAnswered(current, drafts[current.id]) : true;
    const goTo = (index) => {
        hasStepped.current = true;
        setStep(index);
    };
    const submit = () => onSubmit?.(questions.map((item) => toAnswer(item, drafts[item.id])));
    const advance = () => {
        if (!current || !canAnswer)
            return;
        if (!isStepAnswered)
            setRevealed((ids) => new Set(ids).add(current.id));
        else if (step < questions.length - 1)
            goTo(step + 1);
        else if (firstOpen === -1)
            submit();
        else
            goTo(firstOpen);
    };
    return (_jsxs(_Fragment, { children: [_jsx(QuestionTabs, { questions: questions, drafts: drafts, step: step, answeredMark: answeredMark, onSelect: setStep, children: current ? (_jsx(QuestionItem, { ref: itemRef, item: current, draft: drafts[current.id] ?? emptyDraft, onDraftChange: (draft) => setDrafts((all) => ({ ...all, [current.id]: draft })), isReadOnly: !canAnswer, isRevealed: revealed.has(current.id), onEnter: advance }, current.id)) : null }), failure ? _jsx(InlineError, { className: hooks.slotClass('error'), children: failure }) : null, _jsx(QuestionActions, { step: step, count: questions.length, canStep: isStepAnswered || !onSubmit, isComplete: firstOpen === -1, running: running, onStep: goTo, onSubmit: onSubmit && submit, onDismiss: onDismiss })] }));
}
//# sourceMappingURL=chat-question-pending.js.map