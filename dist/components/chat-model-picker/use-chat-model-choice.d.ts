import type { ChatEffortOption, ChatModelOption, ChatModelPickerProps } from './chat-model-picker.js';
/** The current model and effort, the efforts the model takes, and the reader's ways to change them. */
export interface ChatModelChoice {
    /** The current model; undefined without models. */
    model: ChatModelOption | undefined;
    /** The efforts the current model takes, in order; empty when it takes none. */
    efforts: readonly ChatEffortOption[];
    /** The current effort; undefined while the model takes none. */
    effort: ChatEffortOption | undefined;
    /** Chooses an available model, moving the effort to one the model takes. */
    chooseModel: (id: string) => void;
    /** Chooses one of the current model's efforts. */
    chooseEffort: (id: string) => void;
}
/**
 * The picker's model and effort, each controlled or held by the picker (in the provider's storage
 * under `persistKey`). The effort shown is the first of the controlled, held and default efforts
 * the model takes, else the model's default effort, else its first. Choosing a model that does not
 * take the current effort moves it to the model's default effort, or its first, and reports it.
 */
export declare function useChatModelChoice(props: ChatModelPickerProps): ChatModelChoice;
//# sourceMappingURL=use-chat-model-choice.d.ts.map