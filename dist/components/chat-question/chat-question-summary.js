import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { chatQuestionHooks as hooks, listAnswerLabels, readAnswerText, } from './chat-question-model.js';
/** What a summary says of one question's answer. */
function describeAnswer(item, answer, strings) {
    if (item.selectionMode === 'none') {
        const text = readAnswerText(answer);
        return text ? strings.questionAnsweredText(text) : strings.questionNoAnswer;
    }
    const labels = answer ? listAnswerLabels(item, answer) : [];
    return labels.length > 0 ? strings.questionChose(labels) : strings.questionNoAnswer;
}
/** An answered card: each question with what the reader chose or wrote. */
export function QuestionSummary({ questions, answers = [], }) {
    const strings = useUiStrings();
    return (_jsx("dl", { ...hooks.slot('summary'), children: questions.map((item) => (_jsxs("div", { ...hooks.slot('summary-item'), children: [_jsx("dt", { ...hooks.slot('summary-question'), children: item.question }), _jsx("dd", { ...hooks.slot('summary-answer'), children: describeAnswer(item, answers.find((answer) => answer.questionId === item.id), strings) })] }, item.id))) }));
}
/** A dismissed card: its first question and a short "Dismissed". */
export function QuestionDismissal({ question }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [question ? _jsx("p", { ...hooks.slot('question'), children: question }) : null, _jsx("p", { ...hooks.slot('status'), children: strings.questionDismissed })] }));
}
//# sourceMappingURL=chat-question-summary.js.map