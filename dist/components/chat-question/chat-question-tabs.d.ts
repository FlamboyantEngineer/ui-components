import { type ReactNode } from 'react';
import { type ChatQuestionAnsweredMark, type ChatQuestionItem, type QuestionDraft } from './chat-question-model.js';
interface QuestionTabsProps {
    questions: readonly ChatQuestionItem[];
    drafts: Readonly<Record<string, QuestionDraft>>;
    /** The shown question's position from 0. */
    step: number;
    answeredMark: ChatQuestionAnsweredMark;
    /** Shows the question at a position, chosen by its tab. */
    onSelect: (step: number) => void;
    /** The shown question. */
    children: ReactNode;
}
/**
 * A pending card's questions as tabs, one per question labelled by its header, the shown one
 * selected; the counter after them; and the shown question in the panel. An answered question's
 * tab says so in its description and, with the `icon` mark, with a check before its label.
 */
export declare function QuestionTabs({ questions, drafts, step, answeredMark, onSelect, children, }: QuestionTabsProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-question-tabs.d.ts.map