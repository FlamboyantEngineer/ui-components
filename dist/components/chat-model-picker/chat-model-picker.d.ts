import type { BaseProps } from '../../core/props.js';
/** A model the reader can send their messages to. */
export interface ChatModelOption {
    /** Identifies the model in `model`, `defaultModel` and `onModelChange`. */
    id: string;
    /** The model's name, on the trigger and in the menu. */
    label: string;
    /** What the model is good at, after its name in the menu. */
    description?: string | undefined;
    /** A short mark after the name in the menu, such as "New". */
    badge?: string | undefined;
    /** Keeps the model listed but out of reach. */
    isDisabled?: boolean | undefined;
    /** Why a disabled model is unavailable, shown in place of its description. */
    disabledReason?: string | undefined;
    /** The ids of the efforts the model takes. Undefined takes every listed effort; empty takes none. */
    efforts?: readonly string[] | undefined;
    /** The effort a switch to this model moves to when the current one does not apply. Defaults to its first. */
    defaultEffort?: string | undefined;
}
/** A reasoning effort a model may take. */
export interface ChatEffortOption {
    /** Identifies the effort in `efforts`, `effort`, `defaultEffort` and `onEffortChange`. */
    id: string;
    /** The effort's name, on the trigger and in the menu. */
    label: string;
    /** What the effort trades, after its name in the menu. */
    description?: string | undefined;
}
export interface ChatModelPickerProps extends BaseProps {
    /** The models, in menu order. */
    models: readonly ChatModelOption[];
    /** The reasoning efforts, in menu order. Without them no model takes an effort. */
    efforts?: readonly ChatEffortOption[] | undefined;
    /** The current model's id, controlled. */
    model?: string | undefined;
    /** The model at first, uncontrolled. Defaults to the first available model. */
    defaultModel?: string | undefined;
    /** Called with the id of the model the reader chooses. */
    onModelChange?: ((model: string) => void) | undefined;
    /** The current effort's id, controlled. */
    effort?: string | undefined;
    /** The effort at first, uncontrolled. Defaults to the model's default effort. */
    defaultEffort?: string | undefined;
    /** Called with the id of the effort the reader chooses, or a model switch moves to. */
    onEffortChange?: ((effort: string) => void) | undefined;
    /** Keeps the uncontrolled model and effort in the provider's storage under this key. */
    persistKey?: string | undefined;
    /** Refuses to open the menu. */
    isDisabled?: boolean | undefined;
}
/**
 * A compact composer tool that shows the current model, and its effort when the model takes one,
 * and opens a menu to choose them: the models with their descriptions, badges and unavailable
 * reasons, then the efforts the chosen model takes. Each choice is controlled or held, optionally
 * in the provider's storage.
 */
export declare function ChatModelPicker(props: ChatModelPickerProps): import("react").JSX.Element | null;
//# sourceMappingURL=chat-model-picker.d.ts.map