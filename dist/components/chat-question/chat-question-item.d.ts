import { type Ref } from 'react';
import { type ChatQuestionItem, type QuestionDraft } from './chat-question-model.js';
interface QuestionItemProps {
    item: ChatQuestionItem;
    draft: QuestionDraft;
    onDraftChange: (draft: QuestionDraft) => void;
    /** Shows the answer without letting the reader change it. */
    isReadOnly: boolean;
    /** Shows the validation of the question's fields now. */
    isRevealed: boolean;
    /** Called on Enter in an answer field. */
    onEnter: () => void;
    /** The question's element, where focus lands when the reader steps to it. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/**
 * One question: its text, and its answer: options as radios or checkboxes, or a field for the
 * reader's own words. Its header labels its tab.
 */
export declare function QuestionItem({ item, draft, onDraftChange, isReadOnly, isRevealed, onEnter, ref, }: QuestionItemProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-question-item.d.ts.map