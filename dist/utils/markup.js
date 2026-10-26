// A DOM-free tokenizer and entity decoder shared by the markup readers (specs/MARKUP.md).
const tagPattern = /<(\/)?([A-Za-z_][\w:.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*?)(\/)?>/y;
const attributePattern = /([^\s=/>"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
const entityPattern = /&(#x[0-9a-f]{1,8}|#[0-9]{1,8}|[a-z][a-z0-9]{1,31});/gi;
const namedEntities = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0',
    ensp: '\u2002',
    emsp: '\u2003',
    thinsp: '\u2009',
    shy: '\u00ad',
    copy: '©',
    reg: '®',
    trade: '™',
    hellip: '…',
    mdash: '—',
    ndash: '–',
    lsquo: '‘',
    rsquo: '’',
    sbquo: '‚',
    ldquo: '“',
    rdquo: '”',
    bdquo: '„',
    laquo: '«',
    raquo: '»',
    bull: '•',
    middot: '·',
    dagger: '†',
    Dagger: '‡',
    para: '¶',
    sect: '§',
    deg: '°',
    plusmn: '±',
    times: '×',
    divide: '÷',
    minus: '−',
    le: '≤',
    ge: '≥',
    ne: '≠',
    asymp: '≈',
    infin: '∞',
    micro: 'µ',
    frac12: '½',
    frac14: '¼',
    frac34: '¾',
    sup2: '²',
    sup3: '³',
    euro: '€',
    pound: '£',
    yen: '¥',
    cent: '¢',
    larr: '←',
    rarr: '→',
    uarr: '↑',
    darr: '↓',
    harr: '↔',
};
function decodeCodePoint(value) {
    const isSurrogate = value >= 0xd800 && value <= 0xdfff;
    return value === 0 || value > 0x10ffff || isSurrogate ? '\ufffd' : String.fromCodePoint(value);
}
/**
 * Decodes numeric character references and the common named entities (`&amp;`, `&nbsp;`,
 * `&mdash;`, …). An unknown name stays as written; a reference to no character becomes U+FFFD.
 */
export function decodeEntities(text) {
    if (!text.includes('&'))
        return text;
    return text.replace(entityPattern, (match, entity) => {
        const lower = entity.toLowerCase();
        if (lower.startsWith('#x'))
            return decodeCodePoint(Number.parseInt(lower.slice(2), 16));
        if (lower.startsWith('#'))
            return decodeCodePoint(Number.parseInt(lower.slice(1), 10));
        return namedEntities[entity] ?? namedEntities[lower] ?? match;
    });
}
function parseAttributes(source) {
    const attributes = {};
    for (const match of source.matchAll(attributePattern)) {
        const name = match[1];
        if (!name || Object.hasOwn(attributes, name))
            continue;
        attributes[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
    }
    return attributes;
}
/** Index just past the `>` that closes a declaration such as a doctype with an internal subset. */
function findDeclarationEnd(markup, start) {
    let depth = 0;
    for (let index = start; index < markup.length; index += 1) {
        const char = markup[index];
        if (char === '[')
            depth += 1;
        else if (char === ']')
            depth = Math.max(0, depth - 1);
        else if (char === '>' && depth === 0)
            return index + 1;
    }
    return markup.length;
}
/** Index just past the next `terminator` from `from`, or the end of the markup. */
function findIndexAfter(markup, terminator, from) {
    const end = markup.indexOf(terminator, from);
    return end === -1 ? markup.length : end + terminator.length;
}
/**
 * Reads a construct that is not an element tag at `open`: a comment, processing instruction or
 * declaration (dropped) or a CDATA section (its text kept). Returns the index after it, or null
 * when `open` starts a tag.
 */
function readNonElement({ markup, tokens }, open) {
    if (markup.startsWith('<!--', open))
        return findIndexAfter(markup, '-->', open + 4);
    if (markup.startsWith('<![CDATA[', open)) {
        const end = findIndexAfter(markup, ']]>', open + 9);
        const text = markup.slice(open + 9, markup.endsWith(']]>', end) ? end - 3 : end);
        if (text)
            tokens.push({ type: 'text', text });
        return end;
    }
    if (markup.startsWith('<?', open))
        return findIndexAfter(markup, '?>', open + 2);
    if (markup.startsWith('<!', open))
        return findDeclarationEnd(markup, open + 2);
    return null;
}
/** Reads the raw text of an element up to its closing tag, which it also reads. */
function readRawText({ markup, tokens }, tag, from) {
    const closer = new RegExp(`</${tag.replaceAll('.', '\\.')}\\s*>`, 'ig');
    closer.lastIndex = from;
    const match = closer.exec(markup);
    const end = match ? match.index : markup.length;
    if (end > from)
        tokens.push({ type: 'text', text: markup.slice(from, end) });
    tokens.push({ type: 'close', tag });
    return match ? closer.lastIndex : markup.length;
}
function readTag(scanner, open) {
    const { markup, tokens } = scanner;
    tagPattern.lastIndex = open;
    const match = tagPattern.exec(markup);
    if (!match) {
        tokens.push({ type: 'text', text: '<' });
        return open + 1;
    }
    const end = tagPattern.lastIndex;
    const [, closing, tag = '', attributeSource = '', selfClosing] = match;
    if (closing) {
        tokens.push({ type: 'close', tag });
        return end;
    }
    const isSelfClosing = Boolean(selfClosing);
    tokens.push({ type: 'open', tag, attributes: parseAttributes(attributeSource), isSelfClosing });
    if (isSelfClosing || !scanner.rawTextElements?.has(tag.toLowerCase()))
        return end;
    return readRawText(scanner, tag, end);
}
/**
 * Splits markup into text, opening-tag and closing-tag tokens without touching the DOM. Comments,
 * processing instructions and declarations are dropped; CDATA sections become text; text has its
 * entities decoded. A `<` that starts no tag is text. The content of a raw-text element is one
 * undecoded text token, followed by its closing tag (implied at the end of the markup).
 */
export function tokenizeMarkup(markup, options = {}) {
    const tokens = [];
    const scanner = { markup, tokens, rawTextElements: options.rawTextElements };
    let index = 0;
    while (index < markup.length) {
        const open = markup.indexOf('<', index);
        const textEnd = open === -1 ? markup.length : open;
        if (textEnd > index) {
            tokens.push({ type: 'text', text: decodeEntities(markup.slice(index, textEnd)) });
        }
        if (open === -1)
            break;
        index = readNonElement(scanner, open) ?? readTag(scanner, open);
    }
    return tokens;
}
/**
 * The tokens outside the elements `isDropped` picks: each picked element is skipped with its
 * content up to its matching closing tag. Elements of the same name nested inside it are counted,
 * so their closing tags do not end the drop early; tag names compare ignoring case.
 */
export function* skipDroppedElements(tokens, { isDropped, isEmpty = (token) => token.isSelfClosing }) {
    let dropping = null;
    let depth = 0;
    for (const token of tokens) {
        if (dropping === null) {
            if (token.type !== 'open' || !isDropped(token))
                yield token;
            else if (!isEmpty(token))
                [dropping, depth] = [token.tag.toLowerCase(), 1];
            continue;
        }
        if (token.type === 'text' || token.tag.toLowerCase() !== dropping)
            continue;
        if (token.type === 'close')
            depth -= 1;
        else if (!isEmpty(token))
            depth += 1;
        if (depth === 0)
            dropping = null;
    }
}
//# sourceMappingURL=markup.js.map