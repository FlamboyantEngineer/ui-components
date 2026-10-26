// Which facet values a facet list shows: matched by the search, selected first, folded past a limit.
/** The options a facet list draws, and how many matching ones its fold hides. */
export function listFacetOptions({ options, query, firstValues, limit, isExpanded, }) {
    const needle = query.trim().toLowerCase();
    const matches = needle
        ? options.filter((option) => option.label.toLowerCase().includes(needle))
        : [...options];
    const first = new Set(firstValues ?? []);
    const ordered = [
        ...matches.filter((option) => first.has(option.value)),
        ...matches.filter((option) => !first.has(option.value)),
    ];
    const isFolded = !needle && !isExpanded && ordered.length > limit;
    const shown = isFolded ? ordered.slice(0, limit) : ordered;
    return { shown, hiddenCount: ordered.length - shown.length, matchCount: matches.length };
}
//# sourceMappingURL=facet-options.js.map