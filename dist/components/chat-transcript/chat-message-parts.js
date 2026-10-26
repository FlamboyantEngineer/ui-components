import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { describeRelativeTime } from '../../utils/relative-time.js';
import { Avatar, splitAvatarIdentity } from '../avatar/avatar.js';
import { Button } from '../button/button.js';
import { RelativeTime } from '../relative-time/relative-time.js';
import { ChatQuote } from './chat-quote.js';
export const chatMessageHooks = createHooks('chat-message', [
    'avatar',
    'body',
    'header',
    'author',
    'time',
    'quote',
    'content',
    'footer',
    'edited',
    'stopped',
    'delivery',
    'delivery-icon',
    'delivery-label',
    'error',
    'retry',
    'reactions',
    'readers',
    'actions',
]);
const hooks = chatMessageHooks;
const deliveryGlyphs = {
    sending: 'clock',
    sent: 'check',
    delivered: 'success',
    read: 'eye',
    failed: 'error',
};
/** A message's time as the absolute date and time, for its accessible name. */
export function useAbsoluteTime(time, getNow) {
    const { locale } = useLocale();
    if (!time)
        return undefined;
    const now = getNow?.() ?? new Date();
    return describeRelativeTime(time, { now, locale, fallbackAfterDays: 7 })?.absolute;
}
/** The author's avatar, marked and named with their presence when they have one. */
export function ChatMessageAvatar({ author }) {
    const [identity, { status, statusLabel }] = splitAvatarIdentity(author);
    return (_jsx(Avatar, { ...identity, status: status, statusLabel: statusLabel, size: "sm", decorative: !status?.trim(), className: hooks.slotClass('avatar') }));
}
/** The author's name (at the start of a group) and the time, when either is shown. */
export function ChatMessageHeader({ authorName, time, getNow, }) {
    if (authorName === undefined && !time)
        return null;
    return (_jsxs("div", { ...hooks.slot('header'), children: [authorName === undefined ? null : _jsx("span", { ...hooks.slot('author'), children: authorName }), time ? (_jsx(RelativeTime, { value: time, getNow: getNow, className: hooks.slotClass('time') })) : null] }));
}
function RetryButton({ onRetry }) {
    const strings = useUiStrings();
    return (_jsx(Button, { size: "sm", variant: "secondary", startIcon: "refresh", className: hooks.slotClass('retry'), onPress: () => onRetry(), children: strings.retry }));
}
/** The edited marker, the stopped marker and the delivery status, with Retry for a failed send. */
function ChatMessageFooter({ isEdited, isCancelled, delivery, onRetry, }) {
    const strings = useUiStrings();
    if (!isEdited && !isCancelled && !delivery)
        return null;
    return (_jsxs("div", { ...hooks.slot('footer'), children: [isEdited ? _jsx("span", { ...hooks.slot('edited'), children: strings.edited }) : null, isCancelled ? _jsx("span", { ...hooks.slot('stopped'), children: strings.chatStopped }) : null, delivery ? (_jsxs("span", { ...hooks.slot('delivery'), children: [_jsx(Glyph, { name: deliveryGlyphs[delivery], className: hooks.slotClass('delivery-icon') }), _jsx("span", { ...hooks.slot('delivery-label'), children: strings.chatDelivery(delivery) })] })) : null, delivery === 'failed' && onRetry ? _jsx(RetryButton, { onRetry: onRetry }) : null] }));
}
/** A slot that renders only when it has content. */
function ChatMessageSlot({ name, children, }) {
    return children ? _jsx("div", { ...hooks.slot(name), children: children }) : null;
}
/**
 * Everything a message that is not deleted shows under its header: the quote, the content, the
 * footer, the error with Retry, the reactions and the actions.
 */
export function ChatMessageBody({ quote, onQuotePress, error, onRetry, isEdited, isCancelled, delivery, reactions, actions, children, }) {
    const quotedId = quote?.messageId;
    return (_jsxs(_Fragment, { children: [quote ? (_jsx(ChatQuote, { authorName: quote.authorName, excerpt: quote.excerpt, className: hooks.slotClass('quote'), onPress: quotedId && onQuotePress ? () => onQuotePress(quotedId) : undefined })) : null, _jsx("div", { ...hooks.slot('content'), children: children }), _jsx(ChatMessageFooter, { isEdited: isEdited, isCancelled: isCancelled, delivery: delivery, onRetry: error ? undefined : onRetry }), error ? (_jsxs("div", { ...hooks.slot('error'), children: [_jsx("span", { role: "alert", children: error }), onRetry ? _jsx(RetryButton, { onRetry: onRetry }) : null] })) : null, _jsx(ChatMessageSlot, { name: "reactions", children: reactions }), _jsx(ChatMessageSlot, { name: "actions", children: actions })] }));
}
//# sourceMappingURL=chat-message-parts.js.map