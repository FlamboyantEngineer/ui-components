// JSON text read as a tree with source offsets, and the place a caret is at in text that may not
// parse yet: the path of the value it is in and whether it is at a key or a value.
import { placeJsonTokens } from './json-text.js';
const SCALARS = new Set(['string', 'number', 'literal']);
function appendNode(node, frame) {
    if (!frame)
        return;
    if (frame.node.kind === 'array')
        frame.node.items.push(node);
    else {
        const key = frame.key;
        frame.node.properties.push({
            key: JSON.parse(key.text),
            start: key.offset,
            end: key.offset + key.text.length,
            value: node,
        });
        delete frame.key;
    }
}
/** Builds a tree from tokens already checked by the native parser. */
function readTree(tokens) {
    const stack = [];
    let root = null;
    for (const token of tokens) {
        const frame = stack.at(-1);
        if (token.text === ':' || token.text === ',')
            continue;
        if (token.text === '}' || token.text === ']') {
            frame.node.end = token.offset + 1;
            stack.pop();
            continue;
        }
        if (frame?.node.kind === 'object' && !frame.key) {
            frame.key = token;
            continue;
        }
        const node = token.text === '{'
            ? { kind: 'object', start: token.offset, end: 0, properties: [] }
            : token.text === '['
                ? { kind: 'array', start: token.offset, end: 0, items: [] }
                : {
                    kind: 'scalar',
                    start: token.offset,
                    end: token.offset + token.text.length,
                    value: JSON.parse(token.text),
                };
        root ??= node;
        appendNode(node, frame);
        if (node.kind !== 'scalar')
            stack.push({ node });
    }
    return root;
}
/** The tree of JSON text, or `null` when it is blank or does not parse. */
export function parseJsonTree(source) {
    if (source.trim() === '')
        return null;
    try {
        JSON.parse(source);
    }
    catch {
        return null;
    }
    return readTree(placeJsonTokens(source));
}
/** A key's text without its quotes, also while it is still being typed. */
function unquote(text) {
    try {
        return JSON.parse(text);
    }
    catch {
        return text.slice(1).replace(/"$/, '');
    }
}
function open(stack, token) {
    const isObject = token.text === '{';
    stack.push({
        kind: isObject ? 'object' : 'array',
        start: token.offset,
        step: isObject ? null : 0,
        expects: isObject ? 'key' : 'value',
    });
    return false;
}
const OPENERS = new Set(['{', '[']);
const CLOSERS = new Set(['}', ']']);
/** Moves a container past a token inside it: a key, a colon, a comma or a value. */
function step(frame, { text, type }) {
    if (frame.expects === 'key' && (type === 'key' || type === 'string')) {
        frame.step = unquote(text);
        frame.expects = 'colon';
    }
    else if (text === ':')
        frame.expects = 'value';
    else if (text === ',') {
        frame.expects = frame.kind === 'object' ? 'key' : 'value';
        if (frame.kind === 'array')
            frame.step = Number(frame.step) + 1;
    }
    else if (SCALARS.has(type) || CLOSERS.has(text))
        frame.expects = 'comma';
}
/** Moves the reader past one token; returns whether a whole root value has been read. */
function advance(stack, token) {
    const { text, type } = token;
    if (OPENERS.has(text))
        return open(stack, token);
    if (CLOSERS.has(text))
        stack.pop();
    const frame = stack.at(-1);
    if (!frame)
        return CLOSERS.has(text) || SCALARS.has(type);
    step(frame, token);
    return false;
}
/** The keys directly inside the object whose `{` is at `start`. */
function collectKeys(tokens, start) {
    const keys = [];
    let depth = 0;
    for (const token of tokens) {
        if (token.offset <= start)
            continue;
        if (OPENERS.has(token.text))
            depth += 1;
        else if (CLOSERS.has(token.text))
            depth -= 1;
        else if (depth === 0 && token.type === 'key')
            keys.push(unquote(token.text));
        if (depth < 0)
            break;
    }
    return keys;
}
/** The key, string, number or literal token the caret is in or right after. */
function findTokenAt(tokens, offset) {
    return tokens.find(({ offset: start, text, type }) => (SCALARS.has(type) || type === 'key') && start < offset && offset <= start + text.length);
}
/**
 * Where the caret at `offset` is: the path of the value its key or value belongs to, whether it
 * is at a key or a value, the token it is in and the keys of its object. Text that does not parse
 * yet is read as far as it goes; `null` after a complete root value.
 */
export function findJsonContext(source, offset) {
    const tokens = placeJsonTokens(source);
    const token = findTokenAt(tokens, offset) ?? null;
    const stack = [];
    let isDone = false;
    for (const entry of tokens) {
        if (entry.offset >= offset || entry === token)
            break;
        isDone = advance(stack, entry);
    }
    const frame = stack.at(-1);
    if (!frame)
        return isDone ? null : { path: [], position: 'value', token, keys: [] };
    const steps = stack.map(({ step }) => step ?? '');
    const position = frame.kind === 'object' && frame.expects === 'key' ? 'key' : 'value';
    return {
        path: position === 'key' ? steps.slice(0, -1) : steps,
        position,
        token,
        keys: frame.kind === 'object' ? collectKeys(tokens, frame.start) : [],
    };
}
//# sourceMappingURL=json-tree.js.map