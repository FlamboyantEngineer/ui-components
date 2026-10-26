// The blocks the insert menus offer, and how a typed query finds them.
import { scoreCompletion } from '../completion-list/completion-list.js';
import { getBlockItems, getWrapItems } from './format-items.js';
const defaultKeywords = {
    paragraph: ['plain', 'text'],
    'heading-1': ['title', 'h1'],
    'heading-2': ['subtitle', 'h2'],
    'heading-3': ['h3'],
    'code-block': ['pre', 'snippet'],
    'bullet-list': ['unordered', 'ul'],
    'numbered-list': ['ordered', 'ol'],
    'task-list': ['todo', 'checkbox'],
    quote: ['blockquote', 'citation'],
    divider: ['rule', 'hr', 'line', 'separator'],
};
function scoreInsertItem(item, query) {
    let best = scoreCompletion(item.label, query);
    if (best === 0)
        return best;
    for (const keyword of item.keywords ?? []) {
        const score = scoreCompletion(keyword, query);
        if (score === 0)
            return score;
        if (score !== null && (best === null || score < best))
            best = score;
    }
    return best;
}
/** The built-in entries: text blocks, lists, quote and divider, then the caller's own. */
export function getInsertItems(strings, extra = []) {
    const builtIn = [
        ...getBlockItems(strings),
        ...getWrapItems(strings),
        {
            id: 'divider',
            label: strings.divider,
            icon: 'minus',
            command: { type: 'insert', node: 'horizontalRule' },
        },
    ];
    return [
        ...builtIn.map(({ id, label, icon, command }) => ({
            id,
            label,
            icon,
            command,
            keywords: defaultKeywords[id],
        })),
        ...extra,
    ];
}
/** The entries matching a typed query by label or keyword, best match first. */
export function matchInsertItems(items, query) {
    if (!query)
        return [...items];
    return items
        .map((item) => ({ item, score: scoreInsertItem(item, query) }))
        .filter(({ score }) => score !== null)
        .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
        .map(({ item }) => item);
}
//# sourceMappingURL=insert-items.js.map