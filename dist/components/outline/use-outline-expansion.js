import { useState } from 'react';
/**
 * Which entries with children are expanded: the controlled keys; else the reader's own toggles over
 * the default keys or, without them, over `collapseBelowLevel` (every entry when it is not set).
 */
export function useOutlineExpansion(parents, { expandedKeys, defaultExpandedKeys, onExpandedChange, collapseBelowLevel, }) {
    const [toggled, setToggled] = useState(() => new Map());
    const [defaults] = useState(() => defaultExpandedKeys === undefined ? undefined : new Set(defaultExpandedKeys));
    const controlled = expandedKeys === undefined ? undefined : new Set(expandedKeys);
    const isExpanded = ({ heading }) => {
        if (controlled)
            return controlled.has(heading.id);
        const own = toggled.get(heading.id);
        if (own !== undefined)
            return own;
        if (defaults)
            return defaults.has(heading.id);
        return collapseBelowLevel === undefined || heading.level < collapseBelowLevel;
    };
    const setExpanded = (entry, next) => {
        const expanded = parents.filter((parent) => (parent === entry ? next : isExpanded(parent)));
        if (!controlled)
            setToggled((current) => new Map(current).set(entry.heading.id, next));
        onExpandedChange?.(new Set(expanded.map((parent) => parent.heading.id)));
    };
    return { isExpanded, setExpanded };
}
//# sourceMappingURL=use-outline-expansion.js.map