import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { ScrollRegion } from '../scroll-region/scroll-region.js';
import { TranscriptAnnouncerRegion } from './transcript-announcer.js';
import { TranscriptContext } from './transcript-context.js';
import { transcriptHooks as hooks } from './transcript-hooks.js';
import { handleTranscriptBlur, handleTranscriptFocus, handleTranscriptKeyDown, handleTranscriptTab, } from './transcript-keyboard.js';
import { renderTranscriptItems, TranscriptHistory, TranscriptJumpButton, TranscriptUnreadBar, } from './transcript-parts.js';
import { useTranscript } from './use-transcript.js';
/** The feed of messages: one tab stop, with the keyboard model and the children to draw. */
function TranscriptFeed({ model, isLoadingOlder, labelling, }) {
    const { runtime, navigation } = model;
    return (_jsx(TranscriptContext, { value: runtime.registry, children: _jsx("div", { ...labelling, ...hooks.slot('feed'), ref: runtime.feed, role: "feed", "aria-busy": isLoadingOlder || undefined, onKeyDown: (event) => handleTranscriptKeyDown(event, navigation), onKeyDownCapture: (event) => handleTranscriptTab(event, navigation), onFocus: (event) => handleTranscriptFocus(event, navigation), onBlur: (event) => handleTranscriptBlur(event, navigation), children: renderTranscriptItems(model.items, model.mounted, runtime.windowModel) }) }));
}
/**
 * A conversation: a `feed` of messages, one tab stop, that follows the latest message (or
 * anchors the reader's sent message at the top), keeps the reader's place as older history loads,
 * announces new messages through its own live region, marks the unread and can virtualize a very
 * long history.
 */
export function ChatTranscript({ children, emptyState, scrollMode = 'follow', onEscape, onLoadOlder, hasOlder = false, isLoadingOlder = false, highlightedMessageId, firstUnreadId, onRead, virtualized = false, className, id, 'aria-label': ariaLabel, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy, 'aria-details': details, ...rest }) {
    const strings = useUiStrings();
    const model = useTranscript({
        ...{ children, scrollMode, onEscape, onLoadOlder, hasOlder, isLoadingOlder },
        ...{ highlightedMessageId, firstUnreadId, onRead, virtualized },
    });
    const isEmpty = model.items.length === 0;
    const { ui, runtime } = model;
    const labelling = {
        'aria-label': labelledBy ? ariaLabel : (ariaLabel ?? strings.conversation),
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
        'aria-details': details,
    };
    return (_jsxs("div", { ...hooks.root({ className, props: rest, data: { empty: isEmpty, virtualized } }), id: id, children: [ui.isUnreadAbove && model.unreadCount > 0 ? (_jsx(TranscriptUnreadBar, { count: model.unreadCount, onJump: model.jumpToUnread })) : null, _jsxs(ScrollRegion, { ref: runtime.viewport, className: hooks.slotClass('log'), onScroll: model.onScroll, children: [hasOlder || isLoadingOlder ? _jsx(TranscriptHistory, { isLoading: isLoadingOlder }) : null, isEmpty ? (emptyState ? (_jsx("div", { ...hooks.slot('empty'), children: emptyState })) : null) : (_jsx(TranscriptFeed, { model: model, isLoadingOlder: isLoadingOlder, labelling: labelling })), scrollMode === 'anchor' ? _jsx("div", { ...hooks.slot('spacer'), ref: runtime.spacer }) : null] }), ui.isAway ? (_jsx(TranscriptJumpButton, { unseenCount: ui.unseenCount, onJump: model.jumpToLatest })) : null, _jsx(TranscriptAnnouncerRegion, { text: model.announcement })] }));
}
export { ChatMessage } from './chat-message.js';
export { ChatQuote } from './chat-quote.js';
export { ChatDateSeparator } from './chat-date-separator.js';
export { ChatUnreadDivider } from './chat-unread-divider.js';
export { ChatTypingIndicator } from './chat-typing-indicator.js';
export { ChatReadReceipts } from './chat-read-receipts.js';
export { groupChatMessages } from './chat-grouping.js';
//# sourceMappingURL=chat-transcript.js.map