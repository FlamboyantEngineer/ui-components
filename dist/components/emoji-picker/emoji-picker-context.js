import { createContext, useContext } from 'react';
import { useStoreValue } from '../../utils/value-store.js';
import { toEmojiSelection } from './emoji-catalog.js';
/** The state an `EmojiPicker` shares with its parts. */
export const EmojiPickerContext = createContext(null);
/** The state of the enclosing `EmojiPicker`, for one of its parts. */
export function useEmojiPickerContext() {
    const state = useContext(EmojiPickerContext);
    if (!state)
        throw new Error('Emoji picker parts must be rendered inside an EmojiPicker.');
    return state;
}
/**
 * The emoji last hovered or focused in the enclosing `EmojiPicker`, as the selection choosing it
 * would report in the current skin tone, or `null` before any.
 */
export function useActiveEmoji() {
    const { activeEmoji, tone } = useEmojiPickerContext();
    const active = useStoreValue(activeEmoji);
    return active ? toEmojiSelection(active, tone) : null;
}
//# sourceMappingURL=emoji-picker-context.js.map