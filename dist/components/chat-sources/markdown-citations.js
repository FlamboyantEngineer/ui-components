import { jsx as _jsx } from "react/jsx-runtime";
import { TextMatch } from '../text-match/text-match.js';
import { ChatCitation } from './chat-citation.js';
const marker = /\[(\d{1,4}(?:[ \t]*,[ \t]*\d{1,4})*)\]/g;
/**
 * Splits text at its citation markers: `[n]`, or `[n, m]` for several, whose every number is a
 * source between 1 and `count`. Other bracketed numbers stay text.
 */
export function splitCitationMarkers(text, count) {
    const pieces = [];
    let from = 0;
    for (const match of text.matchAll(marker)) {
        const numbers = (match[1] ?? '').split(',').map(Number);
        if (!numbers.every((number) => number >= 1 && number <= count))
            continue;
        if (match.index > from)
            pieces.push(text.slice(from, match.index));
        pieces.push(numbers);
        from = match.index + match[0].length;
    }
    if (from < text.length)
        pieces.push(text.slice(from));
    return pieces;
}
/**
 * Creates a `renderNode` for `Markdown` that draws the `[n]` markers in text as `ChatCitation`s of
 * `sources` (the first source is `[1]`). Markers of unknown numbers, and markers in code, stay text.
 * Create it once per sources array (for example with `useMemo`), so a streaming `Markdown` keeps
 * its finished blocks.
 */
export function createCitationOverride(sources) {
    return (node) => {
        if (node.type !== 'text')
            return undefined;
        const pieces = splitCitationMarkers(node.text, sources.length);
        if (pieces.every((piece) => typeof piece === 'string'))
            return undefined;
        return pieces.flatMap((piece, at) => typeof piece === 'string'
            ? [_jsx(TextMatch, { children: piece }, at)]
            : piece.map((index) => (_jsx(ChatCitation, { source: sources[index - 1], index: index }, `${at}-${index}`))));
    };
}
//# sourceMappingURL=markdown-citations.js.map