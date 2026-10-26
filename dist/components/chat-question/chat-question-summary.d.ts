import { type ChatQuestionAnswer, type ChatQuestionItem } from './chat-question-model.js';
/** An answered card: each question with what the reader chose or wrote. */
export declare function QuestionSummary({ questions, answers, }: {
    questions: readonly ChatQuestionItem[];
    answers?: readonly ChatQuestionAnswer[] | undefined;
}): import("react").JSX.Element;
/** A dismissed card: its first question and a short "Dismissed". */
export declare function QuestionDismissal({ question }: {
    question: string | undefined;
}): import("react").JSX.Element;
//# sourceMappingURL=chat-question-summary.d.ts.map