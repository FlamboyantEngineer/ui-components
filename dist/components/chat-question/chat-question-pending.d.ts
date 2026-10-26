import { type ChatQuestionAnswer, type ChatQuestionAnsweredMark, type ChatQuestionItem } from './chat-question-model.js';
import type { QuestionRequestKind } from './chat-question-request.js';
interface PendingQuestionsProps {
    questions: readonly ChatQuestionItem[];
    /** Sends the answers; without it the card is read-only. */
    onSubmit?: ((answers: ChatQuestionAnswer[]) => void) | undefined;
    onDismiss?: (() => void) | undefined;
    /** The request the card sent that has not settled: it locks the answers and the actions. */
    running: QuestionRequestKind | null;
    /** Why the last request failed. */
    failure: string | null;
    answeredMark: ChatQuestionAnsweredMark;
}
/**
 * A pending card: its questions as tabs with a counter, the shown question, the reader's drafts,
 * Back, Next, Submit and Dismiss, and why the last request failed. Any tab shows its question and
 * keeps focus; Back and Next move focus to the answer of the question they show; Enter in an answer
 * field steps on, or submits from the last question. Without `onSubmit`, or while a request runs,
 * the answers are read-only; a read-only card steps through its questions without answers.
 */
export declare function PendingQuestions(props: PendingQuestionsProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-question-pending.d.ts.map