const deliveryLabels = {
    sending: 'Sending',
    sent: 'Sent',
    delivered: 'Delivered',
    read: 'Read',
    failed: 'Not sent',
};
/** `A`, `A and B`, or `A, B and C`. */
function joinNames(names) {
    if (names.length < 2)
        return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
}
export const chatMessageStrings = {
    chatMessageLabel: (author, time) => [author, time].filter(Boolean).join(', '),
    chatDelivery: (delivery) => deliveryLabels[delivery],
    chatMessageDeleted: 'Message deleted',
    chatStopped: 'Stopped',
    chatQuoteLabel: (authorName, excerpt) => `Quote from ${authorName}: ${excerpt}`,
    chatTyping: (names) => {
        if (names.length <= 1)
            return `${names[0] ?? ''} is typing…`;
        if (names.length === 2)
            return `${joinNames(names)} are typing…`;
        return `${names[0] ?? ''} and ${names.length - 1} others are typing…`;
    },
    chatThinking: 'Thinking…',
    chatSeenBy: (names) => names.length <= 3
        ? `Seen by ${joinNames(names)}`
        : `Seen by ${names[0] ?? ''}, ${names[1] ?? ''} and ${names.length - 2} others`,
    chatNewMessages: 'New messages',
};
//# sourceMappingURL=chat-message-strings.js.map