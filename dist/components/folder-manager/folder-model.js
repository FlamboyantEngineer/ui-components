// The folder tree a folder manager shows: the caller's folders, an optional root row standing for
// "no folder", the draft row of a folder being created, and the folders a filter keeps.
import { walkTree } from '../../utils/walk-tree.js';
import { mapTree } from '../../utils/map-tree.js';
import { textMatchesTerms } from '../text-match/text-match.js';
/** The key of the root row. */
export const folderRootKey = 'folder-manager-root';
/** The key of the draft row. */
export const folderDraftKey = 'folder-manager-draft';
function childrenOf(folder) {
    return (folder.children ?? []);
}
function appendDraft(nodes, parentKey, options) {
    if (options.draftParentKey === parentKey) {
        nodes.push({ id: folderDraftKey, name: '', kind: 'draft', folder: null, isLazy: false });
    }
}
/**
 * The tree rows for the folders, with the root row and the draft row when asked for. A filter that
 * matches nothing leaves no row, the root row included, so the tree can say so.
 */
export function buildFolderNodes(folders, options) {
    const { terms = [] } = options;
    const nodes = mapTree(folders, childrenOf, (folder, children) => {
        appendDraft(children, folder.id, options);
        const isMatch = terms.length === 0 || textMatchesTerms(folder.name, terms);
        if (!isMatch && children.length === 0)
            return null;
        return {
            id: folder.id,
            name: folder.name,
            kind: 'folder',
            folder,
            children: children.length > 0 ? children : undefined,
            isLazy: Boolean(folder.hasChildren) && childrenOf(folder).length === 0,
        };
    });
    appendDraft(nodes, null, options);
    if (options.rootLabel === undefined || (terms.length > 0 && nodes.length === 0))
        return nodes;
    return [
        {
            id: folderRootKey,
            name: options.rootLabel,
            kind: 'root',
            folder: null,
            children: nodes,
            isLazy: false,
        },
    ];
}
/** The folder `key` and its ancestors, outermost first, or an empty list when it is missing. */
export function findFolderPath(folders, key) {
    if (key === null)
        return [];
    const levels = [folders[Symbol.iterator]()];
    const path = [];
    while (levels.length > 0) {
        const next = levels.at(-1).next();
        if (next.done) {
            levels.pop();
            continue;
        }
        path.length = levels.length - 1;
        path.push(next.value);
        if (next.value.id === key)
            return path;
        const children = childrenOf(next.value);
        if (children.length > 0)
            levels.push(children[Symbol.iterator]());
    }
    return [];
}
/** How many levels a folder and its deepest subfolder span: 1 for a folder without subfolders. */
export function getFolderHeight(folder) {
    let height = 0;
    const levels = [[folder][Symbol.iterator]()];
    while (levels.length > 0) {
        const next = levels.at(-1).next();
        if (next.done) {
            levels.pop();
            continue;
        }
        height = Math.max(height, levels.length);
        if (next.value.children?.length)
            levels.push(next.value.children[Symbol.iterator]());
    }
    return height;
}
/** The keys of every row that has children. */
export function collectBranchKeys(nodes) {
    const keys = [];
    for (const node of walkTree(nodes, (node) => node.children)) {
        if (node.children)
            keys.push(node.id);
    }
    return keys;
}
/**
 * The folders of `keys` in tree order, leaving out those inside another of them: acting on a
 * folder acts on what it holds.
 */
export function listTopmostFolders(folders, keys) {
    const selected = [];
    for (const folder of walkTree(folders, (folder) => keys.has(folder.id) ? undefined : childrenOf(folder))) {
        if (keys.has(folder.id))
            selected.push(folder);
    }
    return selected;
}
/**
 * Where `moving` folders may go: the top level, then every folder in tree order except the moving
 * ones and the folders inside them, each with the names of its path.
 */
export function listFolderDestinations(folders, moving) {
    const destinations = [{ folder: null, path: [] }];
    const levels = [folders[Symbol.iterator]()];
    const path = [];
    while (levels.length > 0) {
        const next = levels.at(-1).next();
        if (next.done) {
            levels.pop();
            continue;
        }
        const folder = next.value;
        if (moving.has(folder.id))
            continue;
        path.length = levels.length - 1;
        path.push(folder.name);
        destinations.push({ folder, path: [...path] });
        const children = childrenOf(folder);
        if (children.length > 0)
            levels.push(children[Symbol.iterator]());
    }
    return destinations;
}
//# sourceMappingURL=folder-model.js.map