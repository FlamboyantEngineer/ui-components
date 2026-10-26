// The moves that put several folders into one destination, in their tree order.
/** The moving folders not already in the destination (`null`: the top level), in one walk. */
function findKeysToMove(folders, moving, destinationKey) {
    const toMove = new Set();
    let remaining = moving.size;
    const levels = [{ folders, parentKey: null, index: 0 }];
    for (let level = levels.at(-1); level; level = levels.at(-1)) {
        const folder = level.folders[level.index++];
        if (!folder) {
            levels.pop();
            continue;
        }
        const key = folder.id;
        if (moving.has(key)) {
            if (level.parentKey !== destinationKey)
                toMove.add(key);
            if (--remaining === 0)
                break;
        }
        if (folder.children)
            levels.push({ folders: folder.children, parentKey: key, index: 0 });
    }
    return toMove;
}
/**
 * The moves that put `moving` (topmost folders, in tree order) into `destination`, as its last
 * children in their order, or at the end of the top level (`null`). Folders already there stay.
 */
export function planFolderMoves(folders, moving, destination) {
    if (moving.length === 0)
        return [];
    const keys = findKeysToMove(folders, new Set(moving.map((folder) => folder.id)), destination?.id ?? null);
    const toMove = moving.filter((folder) => keys.has(folder.id));
    if (destination) {
        return toMove.map((folder) => ({
            key: folder.id,
            targetKey: destination.id,
            position: 'inside',
        }));
    }
    let anchor = folders.at(-1)?.id;
    return toMove.flatMap((folder) => {
        if (anchor === undefined)
            return [];
        const move = { key: folder.id, targetKey: anchor, position: 'after' };
        anchor = folder.id;
        return [move];
    });
}
//# sourceMappingURL=folder-moves.js.map