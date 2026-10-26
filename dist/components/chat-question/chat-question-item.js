import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { QuestionChoices } from './chat-question-choices.js';
import { QuestionTextField } from './chat-question-fields.js';
import { chatQuestionHooks as hooks, } from './chat-question-model.js';
/**
 * One question: its text, and its answer: options as radios or checkboxes, or a field for the
 * reader's own words. Its header labels its tab.
 */
export function QuestionItem({ item, draft, onDraftChange, isReadOnly, isRevealed, onEnter, ref, }) {
    const questionId = useId();
    return (_jsxs("div", { ...hooks.slot('item', { selectionMode: item.selectionMode }), ref: ref, children: [_jsx("p", { ...hooks.slot('question'), id: questionId, children: item.question }), item.selectionMode === 'none' ? (_jsx(QuestionTextField, { slot: "text", label: item.question, draft: draft, onDraftChange: onDraftChange, isReadOnly: isReadOnly, isRevealed: isRevealed, onEnter: onEnter })) : (_jsx(QuestionChoices, { item: item, draft: draft, onDraftChange: onDraftChange, isReadOnly: isReadOnly, labelId: questionId, isRevealed: isRevealed, onEnter: onEnter }))] }));
}
//# sourceMappingURL=chat-question-item.js.map