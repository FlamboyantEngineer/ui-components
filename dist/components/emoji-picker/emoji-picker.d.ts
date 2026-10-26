import { type ReactNode } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type EmojiChoiceFilters, type EmojiChoiceHandlers, type EmojiPickerStateOptions, type EmojiSources, type SkinToneState } from './emoji-picker-state.js';
export interface EmojiPickerProps extends AriaLabellingProps, SkinToneState, EmojiSources, EmojiChoiceHandlers, EmojiChoiceFilters, Pick<EmojiPickerStateOptions, 'loadEmoji' | 'renderEmoji'>, BaseProps {
    /** Hide the skin tone choice, for a host that sets the tone elsewhere. */
    hideSkinTones?: boolean | undefined;
    /** Called with the search text as it changes, for a host that fetches custom emoji. */
    onSearchChange?: ((value: string) => void) | undefined;
    /** Focus the search field when the picker mounts. */
    autoFocus?: boolean | undefined;
    /**
     * The picker's parts (`EmojiPickerSearch`, `EmojiPickerBody`, `EmojiPickerPreview`,
     * `EmojiPickerSkinTones`) in a layout of the caller's own, instead of the default one.
     */
    children?: ReactNode;
}
export interface EmojiPickerTriggerProps extends Omit<EmojiPickerProps, 'children'> {
    /** The button that opens the picker, such as a `Button` or `Button`. */
    children: ReactNode;
}
/**
 * Chooses a standard or custom emoji: search, category tabs, a two-dimensional emoji grid, recently
 * used emoji and a skin tone choice. Data comes in as props and leaves through callbacks.
 */
export declare function EmojiPicker({ onSelect, skinTone, defaultSkinTone, onSkinToneChange, hideSkinTones, recentEmoji, onRecentEmojiChange, customEmoji, onSearchChange, autoFocus, loadEmoji, renderEmoji, categories, emojiVersion, filterEmoji, children, className, ...rest }: EmojiPickerProps): import("react").JSX.Element;
/** Opens an `EmojiPicker` in a popover from the button it wraps; choosing an emoji closes it. */
export declare function EmojiPickerTrigger({ children, ...props }: EmojiPickerTriggerProps): import("react").JSX.Element;
//# sourceMappingURL=emoji-picker.d.ts.map