import { type EmojiSelection } from './emoji-catalog.js';
import type { EmojiPickerState } from './emoji-picker-state.js';
/** The state an `EmojiPicker` shares with its parts. */
export declare const EmojiPickerContext: import("react").Context<EmojiPickerState | null>;
/** The state of the enclosing `EmojiPicker`, for one of its parts. */
export declare function useEmojiPickerContext(): EmojiPickerState;
/**
 * The emoji last hovered or focused in the enclosing `EmojiPicker`, as the selection choosing it
 * would report in the current skin tone, or `null` before any.
 */
export declare function useActiveEmoji(): EmojiSelection | null;
//# sourceMappingURL=emoji-picker-context.d.ts.map