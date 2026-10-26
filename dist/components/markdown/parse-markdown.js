// A dependency-free Markdown parser: CommonMark's blocks and inlines plus tables, task lists and
// strikethrough, read into a plain, frozen tree (specs/MARKDOWN.md). It never touches the DOM.
import { readAtx, readFencedCode, readIndentedCode, readParagraph, readTable, readThematicBreak, } from './markdown-blocks.js';
import { readBlockquote, readList } from './markdown-containers.js';
import { createHeadingIdAllocator, toPlainText } from './markdown-headings.js';
import { parseMarkdownInlines } from './markdown-inlines.js';
import { expandLeadingTabs, isBlank } from './markdown-lines.js';
/** Block readers in the order they are tried; the paragraph reader takes any other line. */
const blockReaders = [
    readFencedCode,
    readAtx,
    readThematicBreak,
    readBlockquote,
    readList,
    readIndentedCode,
    readTable,
    readParagraph,
];
function queueBlocks(frames, lines) {
    const blocks = [];
    frames.push({ lines, blocks, index: 0 });
    return blocks;
}
function readBlocks(frames, context) {
    while (frames.length > 0) {
        const frame = frames.at(-1);
        const { lines } = frame;
        if (frame.index >= lines.length) {
            frames.pop();
            continue;
        }
        if (isBlank(lines[frame.index] ?? '')) {
            frame.index += 1;
            continue;
        }
        const queuedAt = frames.length;
        for (const read of blockReaders) {
            const result = read(lines, frame.index, context);
            if (!result)
                continue;
            if (result.block)
                frame.blocks.push(result.block);
            frame.index = result.next;
            break;
        }
        // A list queues several items together: parse them in source order before resuming the parent.
        for (let first = queuedAt, last = frames.length - 1; first < last; first += 1, last -= 1) {
            const swap = frames[first];
            frames[first] = frames[last];
            frames[last] = swap;
        }
    }
}
function deepFreeze(value) {
    const pending = [value];
    while (pending.length > 0) {
        const item = pending.pop();
        if (typeof item !== 'object' || item === null || Object.isFrozen(item))
            continue;
        Object.freeze(item);
        for (const child of Object.values(item))
            pending.push(child);
    }
    return value;
}
/**
 * Parses Markdown into a frozen document tree. Raw HTML is not interpreted: it stays text. Links
 * and images with an unsafe URL keep only their text. Headings get unique slug ids.
 */
export function parseMarkdown(source) {
    const lines = source
        .replaceAll('\u0000', '\ufffd')
        .split(/\r\n?|\n/)
        .map(expandLeadingTabs);
    const frames = [];
    const context = {
        definitions: new Map(),
        inlines: [],
        headings: [],
        parseBlocks: (inner) => queueBlocks(frames, inner),
    };
    const children = queueBlocks(frames, lines);
    readBlocks(frames, context);
    for (const { target, text } of context.inlines) {
        for (const inline of parseMarkdownInlines(text, context.definitions))
            target.push(inline);
    }
    const allocateId = createHeadingIdAllocator();
    for (const heading of context.headings)
        heading.id = allocateId(toPlainText(heading.children));
    return deepFreeze({ type: 'document', children });
}
//# sourceMappingURL=parse-markdown.js.map