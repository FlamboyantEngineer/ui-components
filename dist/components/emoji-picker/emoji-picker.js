import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useRef } from 'react';
import { Dialog, DialogTrigger, Popover } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { EmojiPickerBody } from './emoji-picker-body.js';
import { EmojiPickerContext } from './emoji-picker-context.js';
import { EmojiPickerPreview, EmojiPickerSearch } from './emoji-picker-parts.js';
import { useEmojiPickerState, } from './emoji-picker-state.js';
import { EmojiPickerSkinTones } from './skin-tone-picker.js';
const hooks = createHooks('emoji-picker', ['popover', 'footer']);
/** The search field, the body and a footer with the preview and the skin tones. */
function EmojiPickerLayout({ hideSkinTones }) {
    return (_jsxs(_Fragment, { children: [_jsx(EmojiPickerSearch, {}), _jsx(EmojiPickerBody, {}), _jsxs("div", { ...hooks.slot('footer'), children: [_jsx(EmojiPickerPreview, {}), hideSkinTones ? null : _jsx(EmojiPickerSkinTones, {})] })] }));
}
/**
 * Chooses a standard or custom emoji: search, category tabs, a two-dimensional emoji grid, recently
 * used emoji and a skin tone choice. Data comes in as props and leaves through callbacks.
 */
export function EmojiPicker({ onSelect, skinTone, defaultSkinTone, onSkinToneChange, hideSkinTones, recentEmoji, onRecentEmojiChange, customEmoji, onSearchChange, autoFocus, loadEmoji, renderEmoji, categories, emojiVersion, filterEmoji, children, className, ...rest }) {
    const strings = useUiStrings();
    const rootRef = useRef(null);
    const state = useEmojiPickerState({
        onSelect,
        skinTone,
        defaultSkinTone,
        onSkinToneChange,
        recentEmoji,
        onRecentEmojiChange,
        customEmoji,
        onSearchChange,
        autoFocus,
        loadEmoji,
        renderEmoji,
        categories,
        emojiVersion,
        filterEmoji,
        rootRef,
    });
    return (_jsx(Dialog, { ...rest, ref: rootRef, ...hooks.root({ className, data: { loading: !state.data.emoji && !state.data.failed } }), "aria-label": rest['aria-label'] ?? strings.emojiPicker, children: _jsx(EmojiPickerContext.Provider, { value: state, children: children ?? _jsx(EmojiPickerLayout, { hideSkinTones: hideSkinTones }) }) }));
}
/** Opens an `EmojiPicker` in a popover from the button it wraps; choosing an emoji closes it. */
export function EmojiPickerTrigger({ children, ...props }) {
    return (_jsxs(DialogTrigger, { children: [children, _jsx(Popover, { className: hooks.slotClass('popover'), children: _jsx(EmojiPicker, { autoFocus: true, ...props }) })] }));
}
//# sourceMappingURL=emoji-picker.js.map