/** Joins non-empty entry groups, keeping separators out of empty and edge positions. */
export function joinMenuGroups(groups) {
    return groups
        .filter((group) => group.length > 0)
        .flatMap((group, index) => index === 0 ? group : [{ type: 'separator', id: `separator-${index}` }, ...group]);
}
//# sourceMappingURL=menu-groups.js.map