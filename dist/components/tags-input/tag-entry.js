// How typed or pasted text becomes tags: where it splits, which tags a field refuses and why.
/** Text that splits into several tags: a pasted line break always splits. */
const lineBreak = String.raw `\r?\n`;
function escapePattern(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, String.raw `\$&`);
}
function createDelimiterPattern(delimiters) {
    const sources = delimiters.filter((delimiter) => delimiter !== '').map(escapePattern);
    return new RegExp([...sources, lineBreak].join('|'), 'g');
}
/** Splits text at each delimiter and line break. */
export function splitTagText(text, delimiters) {
    return text.split(createDelimiterPattern(delimiters));
}
/** Whether the text holds a delimiter or a line break. */
export function hasTagDelimiter(text, delimiters) {
    return createDelimiterPattern(delimiters).test(text);
}
/**
 * Why the field refuses a tag, given the tags it already holds: it is full, it holds the tag
 * already, or the caller's check refuses it. `null` accepts the tag.
 */
function checkTagAgainst(tag, value, rules) {
    const { maxValues, strings } = rules;
    if (maxValues !== undefined && value.length >= maxValues) {
        return {
            severity: 'error',
            message: strings.tooManyValues(maxValues),
            validity: 'rangeOverflow',
        };
    }
    if (!rules.allowsDuplicates && value.has(tag)) {
        return { severity: 'error', message: strings.duplicateValue(tag), validity: 'customError' };
    }
    const message = rules.validateTag?.(tag);
    return message ? { severity: 'error', message, validity: 'customError' } : null;
}
export function checkTag(tag, value, rules) {
    return checkTagAgainst(tag, { length: value.length, has: (tag) => value.includes(tag) }, rules);
}
/**
 * Turns entered text into tags, trimmed, skipping empty ones. With `keepLast` the text after the
 * last delimiter stays in the input, as it is still being typed. Refused tags stay in the input
 * too, ahead of it and joined by the first delimiter, so the reader can correct them.
 */
export function resolveTagEntry(text, options) {
    const { value, rules } = options;
    const parts = splitTagText(text, rules.delimiters);
    const last = options.keepLast ? parts.pop() : undefined;
    const added = [];
    const refused = [];
    const selected = rules.allowsDuplicates ? null : new Set(value);
    const current = { length: value.length, has: (tag) => selected?.has(tag) ?? false };
    for (const part of parts) {
        const tag = part.trim();
        if (tag === '')
            continue;
        if (checkTagAgainst(tag, current, rules))
            refused.push(tag);
        else {
            added.push(tag);
            selected?.add(tag);
            current.length++;
        }
    }
    const kept = last ? [...refused, last] : refused;
    return { added, inputValue: kept.join(rules.delimiters[0] ?? ' '), rejected: refused[0] ?? null };
}
//# sourceMappingURL=tag-entry.js.map