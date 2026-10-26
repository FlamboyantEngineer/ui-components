// The message a composer holds: Markdown text and the mentions, commands and record references
// placed in it.
/** The character that opens a token's completions and starts its text; a reference has none. */
export const tokenTriggers = {
    mention: '@',
    command: '/',
    reference: '',
};
const tokenKinds = new Set(Object.keys(tokenTriggers));
export const emptyMessage = { text: '', tokens: [] };
function isToken(value) {
    const token = value;
    return (typeof token?.start === 'number' &&
        typeof token.end === 'number' &&
        tokenKinds.has(token.kind) &&
        typeof token.id === 'string' &&
        typeof token.label === 'string' &&
        (token.recordType === undefined || typeof token.recordType === 'string'));
}
/** Whether a value read back from storage is a message. */
function isMessage(value) {
    const message = value;
    return (typeof message?.text === 'string' &&
        Array.isArray(message.tokens) &&
        message.tokens.every(isToken));
}
/** Whether two messages hold the same text and tokens. */
export function isSameMessage(a, b) {
    return a.text === b.text && JSON.stringify(a.tokens) === JSON.stringify(b.tokens);
}
/**
 * Stores a draft as the message's JSON, whichever composer holds it, so plain and rich composers
 * read each other's drafts; anything else in storage reads as a parse failure.
 */
export function createMessageCodec(toMessage, fromMessage) {
    return {
        stringify: (value) => JSON.stringify(toMessage(value)),
        parse: (raw) => {
            const value = JSON.parse(raw);
            if (!isMessage(value))
                throw new Error('Not a stored message.');
            return fromMessage(value);
        },
    };
}
//# sourceMappingURL=composer-message.js.map