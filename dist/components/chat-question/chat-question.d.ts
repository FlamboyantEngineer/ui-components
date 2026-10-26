import type { BaseProps } from '../../core/props.js';
import { type ChatQuestionAnswer, type ChatQuestionAnsweredMark, type ChatQuestionData } from './chat-question-model.js';
export type { ChatQuestionAnswer, ChatQuestionAnsweredMark, ChatQuestionData, ChatQuestionItem, ChatQuestionOption, ChatQuestionSelectionMode, ChatQuestionStatus, } from './chat-question-model.js';
export interface ChatQuestionProps extends BaseProps, ChatQuestionData {
    /** Identifies the card, and is its root element's id. */
    id: string;
    /**
     * Receives the answers, one per question in order, when the reader submits. A returned promise
     * locks the card until it settles; a rejection keeps the answers and shows why. Without it a
     * pending card is read-only.
     */
    onSubmit?: ((answers: ChatQuestionAnswer[]) => void | Promise<unknown>) | undefined;
    /** Draws a Dismiss button that calls this; a returned promise is awaited like `onSubmit`'s. */
    onDismiss?: (() => void | Promise<unknown>) | undefined;
    /**
     * How the tab of an answered question shows it: `icon` (the default) draws a check before its
     * label; `style` draws nothing, leaving the tab's `data-answered` to the stylesheet.
     */
    answeredMark?: ChatQuestionAnsweredMark | undefined;
}
/**
 * An inline card in which an agent asks the reader one or several questions: a `group` named from
 * the first question, answered by radios, checkboxes or the reader's own words and submitted
 * together, read-only without `onSubmit`. A pending card announces itself politely once and is
 * locked while the answers or the dismissal it sent are unsettled; an answered card sums up the
 * answers and a dismissed one says so.
 */
export declare function ChatQuestion({ id, questions, status, answers, onSubmit, onDismiss, answeredMark, className, ...rest }: ChatQuestionProps): import("react").JSX.Element;
//# sourceMappingURL=chat-question.d.ts.map