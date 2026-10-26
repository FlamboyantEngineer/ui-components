// Container block readers of the Markdown parser: block quotes and lists (specs/MARKDOWN.md).
import { indentOf, interruptsParagraph, isBlank, isFenceClose, readFence, readListMarker, stripBlockquoteMarker, } from './markdown-lines.js';
const taskMarker = /^\[([ xX])\][ \t]+(?=\S)/;
/** A paragraph continuation line without the container's marker or indentation. */
function isLazyLine(previous, line, next) {
    if (previous === undefined || isBlank(previous) || isBlank(line))
        return false;
    if (indentOf(previous) >= 4 || readFence(previous))
        return false;
    return !interruptsParagraph(line, next) && readListMarker(line) === null;
}
export const readBlockquote = (lines, at, context) => {
    if (stripBlockquoteMarker(lines[at] ?? '') === null)
        return null;
    const inner = [];
    let index = at;
    for (; index < lines.length; index += 1) {
        const line = lines[index] ?? '';
        const stripped = stripBlockquoteMarker(line);
        if (stripped !== null)
            inner.push(stripped);
        else if (isLazyLine(inner.at(-1), line, lines[index + 1]))
            inner.push(line);
        else
            break;
    }
    return { block: { type: 'blockquote', children: context.parseBlocks(inner) }, next: index };
};
function nextNonBlank(lines, from) {
    let index = from;
    while (index < lines.length && isBlank(lines[index] ?? ''))
        index += 1;
    return index;
}
/** Reads one list item's lines, without its marker and content indentation. */
function collectItem(lines, at, marker) {
    const head = (lines[at] ?? '').slice(marker.contentIndent);
    const task = taskMarker.exec(head);
    const itemLines = [task ? head.slice(task[0].length) : head];
    let index = at + 1;
    while (index < lines.length) {
        const line = lines[index] ?? '';
        if (isBlank(line)) {
            const resume = nextNonBlank(lines, index);
            if (resume >= lines.length || indentOf(lines[resume] ?? '') < marker.contentIndent)
                break;
            for (; index < resume; index += 1)
                itemLines.push('');
        }
        else if (indentOf(line) >= marker.contentIndent) {
            itemLines.push(line.slice(marker.contentIndent));
            index += 1;
        }
        else if (isLazyLine(itemLines.at(-1), line, lines[index + 1])) {
            itemLines.push(line.trimStart());
            index += 1;
        }
        else {
            break;
        }
    }
    const checked = task ? task[1] !== ' ' : null;
    return { lines: itemLines, checked, next: index };
}
/**
 * Whether a blank line separates two of an item's own blocks, rather than lines inside its fenced
 * code or between the items of a list nested in it.
 */
function hasLooseGap(lines) {
    let fence = null;
    let previous = '';
    let sawBlank = false;
    for (const line of lines) {
        if (fence) {
            if (isFenceClose(line, fence))
                fence = null;
        }
        else if (isBlank(line)) {
            sawBlank = previous !== '';
            continue;
        }
        else {
            const isNested = indentOf(previous) > 0 || readListMarker(previous) !== null;
            if (sawBlank && !isNested)
                return true;
            fence = readFence(line);
        }
        previous = line;
        sawBlank = false;
    }
    return false;
}
function isSibling(marker, first) {
    return marker !== null && marker.ordered === first.ordered && marker.symbol === first.symbol;
}
export const readList = (lines, at, context) => {
    const first = readListMarker(lines[at] ?? '');
    if (!first)
        return null;
    const items = [];
    let tight = true;
    let index = at;
    while (index < lines.length) {
        const marker = readListMarker(lines[index] ?? '');
        if (!isSibling(marker, first))
            break;
        const item = collectItem(lines, index, marker);
        if (hasLooseGap(item.lines))
            tight = false;
        items.push({
            type: 'listItem',
            checked: item.checked,
            children: context.parseBlocks(item.lines),
        });
        const resume = nextNonBlank(lines, item.next);
        if (resume === item.next || !isSibling(readListMarker(lines[resume] ?? ''), first)) {
            index = item.next;
            continue;
        }
        tight = false;
        index = resume;
    }
    return {
        block: { type: 'list', ordered: first.ordered, start: first.start, tight, children: items },
        next: index,
    };
};
//# sourceMappingURL=markdown-containers.js.map