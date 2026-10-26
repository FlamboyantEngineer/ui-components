// Filtering a tree by text: matching rows show with their ancestors, expanded to reveal them, and
// with their own descendants.
import { useMemo, useState } from 'react';
import { mapTree } from '../../utils/map-tree.js';
import { splitMatchTerms, textMatchesTerms } from '../text-match/text-match.js';
/** Records matching ancestry on descent and retained children on ascent. */
function filterItems(items, context) {
    const matched = new Set();
    const insideMatch = new Set();
    return mapTree(items, (item) => {
        const isMatch = context.isMatch(item);
        if (isMatch)
            matched.add(item.id);
        const children = context.getChildren(item) ?? [];
        if (isMatch || insideMatch.has(item.id)) {
            for (const child of children)
                insideMatch.add(child.id);
        }
        return children;
    }, (item, children) => {
        context.children.set(item.id, children);
        const hasMatch = children.some((child) => matched.has(child.id) || context.revealed.has(child.id));
        if (hasMatch)
            context.revealed.add(item.id);
        return matched.has(item.id) || hasMatch || insideMatch.has(item.id) ? item : null;
    });
}
/**
 * The tree as `filterText` filters it. While it is not blank, the rows whose text value matches
 * show, with their ancestors (expanded) and their descendants; expanding and collapsing then
 * changes a separate expansion, so the reader's own returns once the filter clears.
 */
export function useTreeFilter(options) {
    const { items, getChildren, getTextValue, filterText = '', filter, expansion } = options;
    const isFiltering = filterText.trim() !== '';
    const result = useMemo(() => {
        if (!isFiltering)
            return null;
        const terms = splitMatchTerms(filterText);
        const context = {
            isMatch(item) {
                const text = getTextValue(item);
                return filter ? filter(text, filterText) : textMatchesTerms(text, terms);
            },
            getChildren,
            children: new Map(),
            revealed: new Set(),
        };
        const kept = filterItems(items, context);
        const getShownChildren = (item) => context.children.get(item.id) ?? getChildren(item);
        return { kept, getShownChildren, revealed: context.revealed };
    }, [isFiltering, items, getChildren, getTextValue, filterText, filter]);
    const [chosen, setChosen] = useState(null);
    if (!result)
        return { items, getChildren, expansion };
    const expandedKeys = chosen?.text === filterText ? chosen.keys : new Set(result.revealed);
    const setExpandedKeys = (keys) => setChosen({ text: filterText, keys });
    return {
        items: result.kept,
        getChildren: result.getShownChildren,
        expansion: {
            expandedKeys,
            setExpandedKeys,
            expand: (key) => setExpandedKeys(new Set([...expandedKeys, key])),
        },
    };
}
//# sourceMappingURL=use-tree-filter.js.map