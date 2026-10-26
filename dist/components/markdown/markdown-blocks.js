// Leaf block readers of the Markdown parser: code, headings, breaks, tables and paragraphs with
// their link reference definitions (specs/MARKDOWN.md).
import { normalizeLabel, unescapeMarkdown } from './markdown-inline-syntax.js';
import { indentOf, interruptsParagraph, isBlank, isFenceClose, isTableStart, isThematicBreak, readAtxHeading, readFence, readSetextLevel, readTableDivider, splitTableCells, } from './markdown-lines.js';
const definitionPattern = /^\[((?:[^\\[\]]|\\.){1,999})\]:[ \t]*(<[^<>\n]*>|\S+)(?:[ \t]+("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\((?:[^()\\]|\\.)*\)))?[ \t]*$/;
/** An inline array filled after the block pass, when every link definition is known. */
export function deferInlines(context, text) {
    const target = [];
    context.inlines.push({ target, text });
    return target;
}
function createHeading(context, level, text) {
    const heading = {
        type: 'heading',
        level: level,
        id: '',
        children: deferInlines(context, text),
    };
    context.headings.push(heading);
    return heading;
}
function stripIndent(line, columns) {
    return line.slice(Math.min(columns, indentOf(line)));
}
export const readFencedCode = (lines, at) => {
    const fence = readFence(lines[at] ?? '');
    if (!fence)
        return null;
    const body = [];
    let index = at + 1;
    for (; index < lines.length && !isFenceClose(lines[index] ?? '', fence); index += 1) {
        body.push(stripIndent(lines[index] ?? '', fence.indent));
    }
    const word = fence.info.split(/\s+/)[0];
    const language = word ? unescapeMarkdown(word) : null;
    return {
        block: { type: 'codeBlock', language, text: body.join('\n') },
        next: Math.min(index + 1, lines.length),
    };
};
export const readIndentedCode = (lines, at) => {
    if (indentOf(lines[at] ?? '') < 4)
        return null;
    const body = [];
    let index = at;
    for (; index < lines.length; index += 1) {
        const line = lines[index] ?? '';
        if (!isBlank(line) && indentOf(line) < 4)
            break;
        body.push(isBlank(line) ? '' : line.slice(4));
    }
    while (body.at(-1) === '')
        body.pop();
    return { block: { type: 'codeBlock', language: null, text: body.join('\n') }, next: index };
};
export const readAtx = (lines, at, context) => {
    const heading = readAtxHeading(lines[at] ?? '');
    if (!heading)
        return null;
    return { block: createHeading(context, heading.level, heading.text), next: at + 1 };
};
export const readThematicBreak = (lines, at) => isThematicBreak(lines[at] ?? '') ? { block: { type: 'thematicBreak' }, next: at + 1 } : null;
export const readTable = (lines, at, context) => {
    const head = lines[at] ?? '';
    const align = isTableStart(head, lines[at + 1]) ? readTableDivider(lines[at + 1] ?? '') : null;
    if (!align)
        return null;
    const toCells = (line) => align.map((_, column) => deferInlines(context, splitTableCells(line)[column] ?? ''));
    const header = toCells(head);
    const rows = [];
    let index = at + 2;
    for (; index < lines.length; index += 1) {
        const line = lines[index] ?? '';
        if (isBlank(line) || interruptsParagraph(line, lines[index + 1]))
            break;
        rows.push(toCells(line));
    }
    return { block: { type: 'table', align, header, rows }, next: index };
};
/** Records the definitions at the start of a paragraph and returns the lines left after them. */
function takeDefinitions(lines, context) {
    let count = 0;
    for (const line of lines) {
        const match = definitionPattern.exec(line);
        const label = match?.[1];
        if (!match || !label?.trim())
            break;
        const key = normalizeLabel(label);
        const destination = (match[2] ?? '').replace(/^<(.*)>$/, '$1');
        const title = match[3] ? unescapeMarkdown(match[3].slice(1, -1)) : null;
        if (!context.definitions.has(key)) {
            context.definitions.set(key, { href: unescapeMarkdown(destination), title });
        }
        count += 1;
    }
    return lines.slice(count);
}
/** Collects paragraph lines from `at` until a blank line, another block or a setext underline. */
function collectParagraph(lines, at) {
    const collected = [];
    let index = at;
    for (; index < lines.length; index += 1) {
        const line = lines[index] ?? '';
        if (isBlank(line))
            break;
        if (collected.length > 0) {
            const level = readSetextLevel(line);
            if (level)
                return { collected, index, level };
            if (interruptsParagraph(line, lines[index + 1]))
                break;
        }
        collected.push(line.trimStart());
    }
    return { collected, index, level: null };
}
export const readParagraph = (lines, at, context) => {
    const { collected, index, level } = collectParagraph(lines, at);
    const rest = takeDefinitions(collected, context);
    const text = rest.join('\n').trimEnd();
    if (!text)
        return { block: null, next: index };
    if (level)
        return { block: createHeading(context, level, text), next: index + 1 };
    return { block: { type: 'paragraph', children: deferInlines(context, text) }, next: index };
};
//# sourceMappingURL=markdown-blocks.js.map