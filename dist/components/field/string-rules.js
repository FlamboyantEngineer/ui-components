function error(message, validity) {
    return { severity: 'error', message, validity };
}
/** A text's length in code points, so a single emoji counts once. */
export function countCodePoints(text) {
    return [...text].length;
}
/**
 * Checks a text against its rules and returns the first broken one as an error with its validity
 * state (`tooShort`, `tooLong` or `patternMismatch`), or `null`. Lengths count code points unless
 * the rules count otherwise.
 */
export function validateString(value, rules, messages) {
    const text = rules.trim ? value.trim() : value;
    if (text === '')
        return null;
    const length = (rules.getLength ?? countCodePoints)(text);
    if (rules.minLength !== undefined && length < rules.minLength) {
        return error(messages.tooShort(rules.minLength), 'tooShort');
    }
    if (rules.maxLength !== undefined && length > rules.maxLength) {
        return error(messages.tooLong(rules.maxLength), 'tooLong');
    }
    if (rules.pattern &&
        !new RegExp(`^(?:${rules.pattern.source})$`, rules.pattern.flags).test(text)) {
        return error(messages.patternMismatch, 'patternMismatch');
    }
    return null;
}
//# sourceMappingURL=string-rules.js.map