import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Spinner } from '../progress-bar/progress-bar.js';
import { TranscriptItemContext } from './transcript-context.js';
import { transcriptHooks as hooks } from './transcript-hooks.js';
/** One child, telling the message inside which child it is. */
function renderItem(item) {
    return (_jsx(TranscriptItemContext, { value: item.key, children: item.node }, `item:${item.key}`));
}
/**
 * The children to draw: every one, or with virtualization the mounted ones, with a spacer as tall
 * as each run of unmounted children between them.
 */
export function renderTranscriptItems(items, mounted, model) {
    if (!mounted)
        return items.map(renderItem);
    const keys = items.map((item) => item.key);
    const nodes = [];
    const pushGap = (start, end) => {
        if (end <= start)
            return;
        const height = model.gapHeight(keys, start, end);
        nodes.push(_jsx("div", { ref: model.spacerRef, style: { height } }, `gap:${start}`));
    };
    let next = 0;
    for (const index of mounted) {
        pushGap(next, index);
        nodes.push(renderItem(items[index]));
        next = index + 1;
    }
    pushGap(next, items.length);
    return nodes;
}
/** The control shown while the reader is away from the bottom, counting what arrived meanwhile. */
export function TranscriptJumpButton({ unseenCount, onJump, }) {
    const strings = useUiStrings();
    return (_jsx(Button, { className: hooks.slotClass('jump'), size: "sm", startIcon: "arrow-down", onPress: onJump, children: unseenCount > 0 ? strings.newMessageCount(unseenCount) : strings.jumpToLatest }));
}
/** The bar shown while the first unread message is above the view, with a control to jump to it. */
export function TranscriptUnreadBar({ count, onJump }) {
    const strings = useUiStrings();
    const countId = useId();
    return (_jsxs("div", { ...hooks.slot('unread'), children: [_jsx("span", { id: countId, children: strings.unreadMessageCount(count) }), _jsx(Button, { size: "sm", startIcon: "arrow-up", "aria-describedby": countId, onPress: onJump, children: strings.jumpToUnread })] }));
}
/**
 * The place above the messages while older ones remain, holding the indicator while they load. It
 * stays while older messages remain, so the indicator appearing never moves the messages.
 */
export function TranscriptHistory({ isLoading }) {
    const strings = useUiStrings();
    return (_jsx("div", { ...hooks.slot('history'), children: isLoading ? _jsx(Spinner, { size: "sm", label: strings.loadingOlderMessages }) : null }));
}
//# sourceMappingURL=transcript-parts.js.map