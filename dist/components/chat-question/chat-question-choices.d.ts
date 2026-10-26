import { type ChatQuestionItem, type QuestionDraft } from './chat-question-model.js';
interface QuestionChoicesProps {
    /** A question asked with options: `single` or `multiple`. */
    item: ChatQuestionItem;
    draft: QuestionDraft;
    onDraftChange: (draft: QuestionDraft) => void;
    /** Shows the choices and the Other field without letting the reader change them. */
    isReadOnly: boolean;
    /** The id of the question's text, which names the group. */
    labelId: string;
    /** Shows the Other field's validation now. */
    isRevealed: boolean;
    /** Called on Enter in the Other field. */
    onEnter: () => void;
}
/**
 * The answer area of a question with options: the group, the Other field once Other is chosen,
 * and the preview of the focused or chosen option. Choosing Other focuses its field, except when
 * an arrow key chose it while moving through the radios, so the arrow keys keep moving.
 */
export declare function QuestionChoices({ item, draft, onDraftChange, isReadOnly, labelId, isRevealed, onEnter, }: QuestionChoicesProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-question-choices.d.ts.map