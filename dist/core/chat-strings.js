export const chatStrings = {
    newMessageAnnouncement: (author, text) => author === null ? `New message: ${text}` : `New message from ${author}: ${text}`,
    newMessageCount: (count) => (count === 1 ? '1 new message' : `${count} new messages`),
    unreadMessageCount: (count) => `${count} unread`,
    jumpToUnread: 'Jump',
    loadingOlderMessages: 'Loading older messages',
    olderMessagesLoaded: (count) => count === 1 ? '1 older message loaded' : `${count} older messages loaded`,
};
//# sourceMappingURL=chat-strings.js.map