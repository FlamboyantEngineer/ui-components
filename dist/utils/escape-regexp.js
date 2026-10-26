/** Quotes text for a literal match inside a regular expression. */
export function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=escape-regexp.js.map