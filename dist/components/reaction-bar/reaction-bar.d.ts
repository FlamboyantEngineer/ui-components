import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type EmojiPickerProps } from '../emoji-picker/emoji-picker.js';
/** The reactions with one emoji. */
export interface ReactionEntry {
    /** The emoji: a standard glyph, in a skin tone or not, or `:shortcode:` for a custom emoji. */
    emoji: string;
    /** How many people reacted. Defaults to the number of `people`. */
    count?: number | undefined;
    /** The reader is one of them. */
    isReacted?: boolean | undefined;
    /** Names of people who reacted, in the order to list them; may be fewer than `count`. */
    people?: readonly string[] | undefined;
}
export interface ReactionBarProps extends BaseProps, AriaLabellingProps, Pick<EmojiPickerProps, 'customEmoji' | 'recentEmoji' | 'onRecentEmojiChange' | 'loadEmoji'> {
    /** The reactions, one chip each in order. Entries counting nobody draw no chip. */
    reactions: readonly ReactionEntry[];
    /**
     * Called with an emoji and whether the reader now reacts with it, from a chip press or a choice
     * in the add-reaction picker. Without it the bar is read-only.
     */
    onToggle?: ((emoji: string, isReacted: boolean) => void) | undefined;
    /** How many names a chip's name lists before it counts the others. Defaults to 3. */
    maxNames?: number | undefined;
}
/**
 * A row of reaction chips, each an emoji with its count that the reader toggles, and an
 * add-reaction button that opens an `EmojiPicker`. Each chip is named by who reacted.
 */
export declare function ReactionBar({ reactions, onToggle, maxNames, customEmoji, recentEmoji, onRecentEmojiChange, loadEmoji, className, ...rest }: ReactionBarProps): import("react").JSX.Element | null;
//# sourceMappingURL=reaction-bar.d.ts.map