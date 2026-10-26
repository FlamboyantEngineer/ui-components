const unreadText = (count) => count === 1 ? '1 unread message' : `${count} unread messages`;
export const chatListStrings = {
    conversations: 'Conversations',
    searchConversations: 'Search conversations',
    newChat: 'New chat',
    noConversations: 'No conversations yet',
    noMatchingConversations: 'No matching conversations',
    loadingConversations: 'Loading conversations',
    unreadMessages: unreadText,
    conversationMuted: 'Muted',
    conversationLabel: ({ title, presence, unreadCount, isMuted, time }) => [
        title,
        presence,
        unreadCount > 0 ? unreadText(unreadCount) : undefined,
        isMuted ? 'muted' : undefined,
        time,
    ]
        .filter(Boolean)
        .join(', '),
};
//# sourceMappingURL=chat-list-strings.js.map