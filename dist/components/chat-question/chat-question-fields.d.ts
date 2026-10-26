import { type ChatQuestionOption, type QuestionDraft } from './chat-question-model.js';
interface QuestionTextFieldProps {
    /** The slot the field fills: the free-text answer or the words for Other. */
    slot: 'text' | 'other';
    /** Names the field. */
    label: string;
    draft: QuestionDraft;
    onDraftChange: (draft: QuestionDraft) => void;
    /** Shows the words without letting the reader change them, and asks for none. */
    isReadOnly: boolean;
    /** Shows the field's validation now rather than once focus leaves it. */
    isRevealed: boolean;
    /** Called on Enter, to go on to the next question or submit. */
    onEnter: () => void;
    autoFocus?: boolean | undefined;
}
interface ChoiceOptionProps {
    option: ChatQuestionOption;
    /** `single` draws a radio, `multiple` a checkbox. */
    selectionMode: 'single' | 'multiple';
    isSelected: boolean;
    /** The option is the "Other" choice. */
    isOther?: boolean | undefined;
}
/**
 * A required single-line field for the reader's own words. Its committed value follows its value,
 * so it is never dirty: no restore button, and Escape stays with the conversation around it.
 */
export declare function QuestionTextField({ slot, label, draft, onDraftChange, isReadOnly, isRevealed, onEnter, autoFocus, }: QuestionTextFieldProps): import("react").JSX.Element;
/**
 * One option: its radio or checkbox, named by the label and the "Recommended" badge, and described
 * by the option's description.
 */
export declare function ChoiceOption({ option, selectionMode, isSelected, isOther }: ChoiceOptionProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=chat-question-fields.d.ts.map