/** The separator `formatPath` joins labels with. */
export const PATH_SEPARATOR = '/';
/**
 * Display text for a location: nonblank trimmed labels joined with `/`. A string is split on `/`;
 * array entries stay whole, so labels that contain slashes (URLs, file names) are kept as they are.
 */
export function formatPath(path, options = {}) {
    const labels = (typeof path === 'string' ? path.split(PATH_SEPARATOR) : (path ?? []))
        .map((label) => label.trim())
        .filter(Boolean);
    if (labels.length === 0)
        return options.emptyLabel ?? (options.rooted ? PATH_SEPARATOR : '');
    return `${options.rooted ? PATH_SEPARATOR : ''}${labels.join(PATH_SEPARATOR)}`;
}
/**
 * The rooted display path of a folder in a flat catalog. Walks parent ids from the folder upwards,
 * keeps the known part when an ancestor is missing, stops before repeating a folder in a cycle and
 * shows a blank name as the folder's id. A missing or absent folder reads `rootLabel`.
 */
export function formatFolderPath(folders, folderId, rootLabel = PATH_SEPARATOR) {
    const id = folderId?.trim();
    if (!id)
        return rootLabel;
    const byId = new Map(folders.map((folder) => [folder.id, folder]));
    const leaf = byId.get(id);
    if (leaf?.path?.trim())
        return formatPath(leaf.path, { rooted: true });
    const names = [];
    const visited = new Set();
    let cursor = leaf;
    while (cursor && !visited.has(cursor.id)) {
        visited.add(cursor.id);
        names.unshift(cursor.name.trim() || cursor.id);
        cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
    }
    return formatPath(names, { rooted: true, emptyLabel: rootLabel });
}
//# sourceMappingURL=path.js.map