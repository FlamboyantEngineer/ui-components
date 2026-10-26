import { useMemo } from 'react';
/** The display options, kept while they stay the same, so unchanged messages do not render again. */
export function useMessageDisplay({ showAvatars, showAuthorNames, showTimes, sentVariant, receivedVariant, }) {
    return useMemo(() => ({ showAvatars, showAuthorNames, showTimes, sentVariant, receivedVariant }), [showAvatars, showAuthorNames, showTimes, sentVariant, receivedVariant]);
}
/** The variant of a message from `origin`; a notice keeps the default. */
export function toMessageVariant(origin, display) {
    if (origin === 'sent')
        return display.sentVariant;
    return origin === 'received' ? display.receivedVariant : undefined;
}
//# sourceMappingURL=chat-message-display.js.map