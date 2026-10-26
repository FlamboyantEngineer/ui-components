import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { splitMatchTerms } from '../text-match/text-match.js';
import { useTreeLoads } from '../tree/tree.js';
import { buildFolderNodes, collectBranchKeys, findFolderPath, folderDraftKey, folderRootKey, listTopmostFolders, } from './folder-model.js';
import { planFolderMoves } from './folder-moves.js';
import { useFolderActions, } from './use-folder-actions.js';
import { useFolderExpansion, useFolderSelection, useRowFocus, } from './use-folder-tree.js';
/**
 * The filter query, and a setter that expands the branches holding the new matches, the root row
 * included.
 */
function useFolderQuery(folders, rootLabel) {
    const [query, setQuery] = useState('');
    const terms = useMemo(() => splitMatchTerms(query), [query]);
    const update = (next, expansion) => {
        setQuery(next);
        const nextTerms = splitMatchTerms(next);
        if (nextTerms.length === 0)
            return;
        expansion.reveal(collectBranchKeys(buildFolderNodes(folders, { rootLabel, terms: nextTerms })));
    };
    return { query, terms, update };
}
/** The selected rows the tree shows: the draft while creating, else the folders or the root row. */
function toSelectedRows(selected, editKey, rootLabel) {
    if (editKey === folderDraftKey)
        return [folderDraftKey];
    if (selected.length > 0)
        return selected;
    return rootLabel === undefined ? [] : [folderRootKey];
}
/**
 * The folder manager's state: selection, expansion, the filter, loading subfolders, edits,
 * deletes and moves, and focus after each.
 */
export function useFolderManager(options) {
    const { folders, rootLabel, isPending = false } = options;
    const messageId = useId();
    const regionRef = useRef(null);
    const nameRef = useRef(null);
    const [focusRequest, setFocusRequest] = useState(null);
    const [selected, select] = useFolderSelection(options);
    const actions = useFolderActions({
        ...options,
        select: (key) => select(key === null ? [] : [key]),
        onSettle: (key) => setFocusRequest({ key: key ?? folderRootKey }),
    });
    const clearFocusRequest = useCallback(() => setFocusRequest(null), []);
    useRowFocus(regionRef, focusRequest, clearFocusRequest);
    const loads = useTreeLoads(options.onLoadChildren);
    const { edit } = actions;
    const draftParentKey = edit?.kind === 'create' ? edit.key : undefined;
    const filter = useFolderQuery(folders, rootLabel);
    const { terms } = filter;
    const nodes = useMemo(() => buildFolderNodes(folders, { rootLabel, draftParentKey, terms }), [folders, rootLabel, draftParentKey, terms]);
    const expansion = useFolderExpansion(nodes, loads.load);
    const setQuery = (query) => filter.update(query, expansion);
    const selection = listTopmostFolders(folders, new Set(selected));
    const path = selected.length === 1 ? findFolderPath(folders, selected[0] ?? null) : [];
    const folder = path.at(-1) ?? null;
    const editKey = edit?.kind === 'create' ? folderDraftKey : (edit?.key ?? null);
    const startEdit = (start) => {
        setQuery('');
        start();
    };
    return {
        nodes,
        selectedRows: toSelectedRows(selected, editKey, rootLabel),
        select,
        expansion,
        actions,
        loads,
        selection,
        path,
        folder,
        editKey,
        isBusy: isPending || actions.isDeleting || edit !== null,
        query: filter.query,
        setQuery,
        regionRef,
        nameRef,
        messageId,
        startCreate: () => startEdit(() => {
            expansion.reveal([folderRootKey, ...path.map((entry) => entry.id)]);
            actions.startCreate(folder?.id ?? null);
        }),
        startRename: () => startEdit(() => (folder ? actions.startRename(folder) : undefined)),
        remove: () => (selection.length > 0 ? void actions.remove(selection) : undefined),
        moveTo: (destination) => {
            for (const move of planFolderMoves(folders, selection, destination))
                options.onMove?.(move);
            if (destination)
                expansion.reveal([...findFolderPath(folders, destination.id).map(({ id }) => id)]);
        },
    };
}
//# sourceMappingURL=use-folder-manager.js.map