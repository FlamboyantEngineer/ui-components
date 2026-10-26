// The rich composer's document as Markdown text with token ranges, and back.
import { composerSchema as schema, getPillText } from './composer-schema.js';
const OPENING_FENCE = /^```([^`\s]*)$/;
const CLOSING_FENCE = '```';
/** A pill's token without its range: `recordType` only when the pill has one. */
function toPillToken({ kind, id, label, recordType }) {
    return { kind, id, label, ...(recordType === undefined ? {} : { recordType }) };
}
/** Lines of text written one after another, with the tokens placed in them. */
function createWriter() {
    const lines = [];
    const tokens = [];
    let length = 0;
    return {
        /** Starts a line and returns where it starts in the text. */
        line(text) {
            const start = lines.length === 0 ? 0 : length + 1;
            lines.push(text);
            length = start + text.length;
            return start;
        },
        token(token) {
            tokens.push(token);
        },
        finish: () => ({ text: lines.join('\n'), tokens }),
    };
}
/** A paragraph as one line, its pills as tokens over their text. */
function writeParagraph(writer, block) {
    let text = '';
    const placed = [];
    block.forEach((child) => {
        if (child.isText) {
            text += child.text ?? '';
            return;
        }
        const pillText = getPillText(child);
        const token = toPillToken(child.attrs);
        placed.push({ ...token, start: text.length, end: text.length + pillText.length });
        text += pillText;
    });
    const start = writer.line(text);
    for (const token of placed) {
        writer.token({ ...token, start: start + token.start, end: start + token.end });
    }
}
/** The document as Markdown: a line per paragraph, code blocks between fences, pills as text. */
export function serializeComposerDocument(doc) {
    const writer = createWriter();
    doc.forEach((block) => {
        if (!block.type.spec.code)
            return writeParagraph(writer, block);
        writer.line(`${CLOSING_FENCE}${String(block.attrs.language ?? '')}`);
        for (const line of block.textContent.split('\n'))
            writer.line(line);
        writer.line(CLOSING_FENCE);
    });
    return writer.finish();
}
/** The paragraph for one line, with a pill for each token that lies within it. */
function parseLine(line, start, tokens) {
    const children = [];
    let at = 0;
    const inside = tokens
        .filter((token) => token.start >= start && token.end <= start + line.length)
        .sort((a, b) => a.start - b.start);
    for (const token of inside) {
        const offset = token.start - start;
        if (offset < at)
            continue;
        if (offset > at)
            children.push(schema.text(line.slice(at, offset)));
        children.push(schema.node('pill', toPillToken(token)));
        at = token.end - start;
    }
    if (at < line.length)
        children.push(schema.text(line.slice(at)));
    return schema.node('paragraph', null, children);
}
/** Where the code block opened at `open` closes, or -1 when it never does. */
function findClosingFence(lines, open) {
    if (!OPENING_FENCE.test(lines[open] ?? ''))
        return -1;
    return lines.findIndex((line, index) => index > open && line === CLOSING_FENCE);
}
/**
 * The document for a message: a paragraph per line with pills over its tokens, and a code block
 * for each fenced run of lines. An unclosed fence stays text.
 */
export function parseComposerMessage(message) {
    const lines = message.text.split('\n');
    const blocks = [];
    let start = 0;
    for (let index = 0; index < lines.length;) {
        const line = lines[index] ?? '';
        const close = findClosingFence(lines, index);
        if (close === -1) {
            blocks.push(parseLine(line, start, message.tokens));
            start += line.length + 1;
            index += 1;
            continue;
        }
        const code = lines.slice(index + 1, close).join('\n');
        const language = OPENING_FENCE.exec(line)?.[1] ?? '';
        blocks.push(schema.node('codeBlock', { language }, code ? schema.text(code) : undefined));
        start += lines.slice(index, close + 1).join('\n').length + 1;
        index = close + 1;
    }
    return schema.node('doc', null, blocks);
}
//# sourceMappingURL=composer-markdown.js.map