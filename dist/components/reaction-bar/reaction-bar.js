import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { normalizeCount } from '../../utils/count.js';
import { Button } from '../button/button.js';
import { EmojiPickerTrigger } from '../emoji-picker/emoji-picker.js';
import { Tooltip } from '../tooltip/tooltip.js';
const hooks = createHooks('reaction-bar', ['reaction', 'emoji', 'image', 'count', 'add']);
const customShortcode = /^:([^:\s]+):$/;
function findCustomEmoji(emoji, customEmoji) {
    const shortcode = customShortcode.exec(emoji)?.[1];
    return shortcode ? customEmoji?.find((entry) => entry.shortcode === shortcode) : undefined;
}
/** One emoji's chip: a toggle button named by the emoji, the count and who reacted. */
function ReactionChip({ reaction, customEmoji, maxNames, onToggle }) {
    const strings = useUiStrings();
    const custom = findCustomEmoji(reaction.emoji, customEmoji);
    const names = (reaction.people ?? []).slice(0, maxNames);
    const label = strings.reactionLabel(custom?.label ?? reaction.emoji, reaction.count, names);
    return (_jsx(Tooltip, { content: label, relationship: "label", children: _jsxs(Button, { variant: "chip", size: "sm", content: "parts", className: hooks.slotClass('reaction'), isSelected: reaction.isReacted ?? false, onChange: (isReacted) => onToggle?.(reaction.emoji, isReacted), isDisabled: !onToggle, focusableWhenDisabled: true, children: [_jsx("span", { ...hooks.slot('emoji'), children: custom ? _jsx("img", { ...hooks.slot('image'), src: custom.src, alt: "" }) : reaction.emoji }), _jsx("span", { ...hooks.slot('count'), children: reaction.count })] }) }));
}
/**
 * A row of reaction chips, each an emoji with its count that the reader toggles, and an
 * add-reaction button that opens an `EmojiPicker`. Each chip is named by who reacted.
 */
export function ReactionBar({ reactions, onToggle, maxNames = 3, customEmoji, recentEmoji, onRecentEmojiChange, loadEmoji, className, ...rest }) {
    const strings = useUiStrings();
    const chips = reactions.flatMap((reaction) => {
        const count = normalizeCount(reaction.count ?? reaction.people?.length) ?? 0;
        return count > 0 ? [{ ...reaction, count }] : [];
    });
    if (chips.length === 0 && !onToggle)
        return null;
    const add = (emoji) => {
        if (!chips.some((chip) => chip.emoji === emoji && chip.isReacted))
            onToggle?.(emoji, true);
    };
    return (_jsxs("div", { ...rest, ...hooks.root({ className, data: { readonly: !onToggle } }), role: "group", "aria-label": rest['aria-label'] ?? (rest['aria-labelledby'] ? undefined : strings.reactions), children: [chips.map((reaction) => (_jsx(ReactionChip, { reaction: reaction, customEmoji: customEmoji, maxNames: maxNames, onToggle: onToggle }, reaction.emoji))), onToggle ? (_jsx(EmojiPickerTrigger, { customEmoji: customEmoji, recentEmoji: recentEmoji, onRecentEmojiChange: onRecentEmojiChange, loadEmoji: loadEmoji, onSelect: (selection) => add(selection.kind === 'native' ? selection.unicode : `:${selection.emoji.shortcode}:`), children: _jsx(Button, { icon: "emoji", label: strings.addReaction, size: "sm", className: hooks.slotClass('add') }) })) : null] }));
}
//# sourceMappingURL=reaction-bar.js.map