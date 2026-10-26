import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { findMaximum } from '../../utils/find-maximum.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { walkTree } from '../../utils/walk-tree.js';
import { useUiStrings } from '../../core/provider.js';
import { InlineError } from '../inline-error/inline-error.js';
import { SearchField } from '../search-field/search-field.js';
import { FolderToolbar, folderManagerHooks as hooks, } from './folder-manager-parts.js';
import { getFolderHeight, listFolderDestinations, } from './folder-model.js';
import { FolderTree } from './folder-tree.js';
import { useFolderManager, } from './use-folder-manager.js';
/** The key of a Move to entry for a destination: its folder's key, or the top level. */
const moveKeyPrefix = 'move-to:';
function availabilityOf({ model, props }) {
    const deleteReason = model.selection
        .map((folder) => props.getDeleteBlockedReason?.(folder))
        .find(Boolean);
    const isFree = !model.isBusy;
    return {
        canRename: model.folder !== null && isFree,
        canDelete: model.selection.length > 0 && isFree && !deleteReason,
        deleteReason: model.selection.length > 0 && isFree ? deleteReason : null,
    };
}
function toolbarOf({ model, props, strings }, { canRename, canDelete, deleteReason }) {
    const atLimit = props.maxDepth !== undefined && model.path.length >= props.maxDepth;
    return {
        create: {
            isOffered: Boolean(props.onCreate),
            isDisabled: model.isBusy || atLimit || model.selection.length > 1,
            reason: atLimit ? strings.folderDepthLimit(props.maxDepth ?? 0) : null,
            onPress: model.startCreate,
        },
        rename: {
            isOffered: Boolean(props.onRename),
            isDisabled: !canRename,
            onPress: model.startRename,
        },
        remove: {
            isOffered: Boolean(props.onDelete),
            isDisabled: !canDelete,
            reason: deleteReason,
            onPress: model.remove,
        },
    };
}
/** Where the selected folders may move: not into themselves, and within the depth limit. */
function destinationsOf({ model, props }) {
    const moving = new Set(model.selection.map((folder) => folder.id));
    const height = findMaximum(model.selection, getFolderHeight, 0);
    const fits = ({ path }) => props.maxDepth === undefined || path.length + height <= props.maxDepth;
    return listFolderDestinations(props.folders, moving).filter(fits);
}
function moveEntryOf(context) {
    const { model, props, strings } = context;
    const topLevel = props.rootLabel ?? strings.topLevel;
    return {
        id: 'move',
        label: strings.moveTo,
        isDisabled: model.selection.length === 0 || model.isBusy,
        // Listed when the menu shows them rather than on every render: they span the whole tree.
        get items() {
            return destinationsOf(context).map(({ folder, path }) => ({
                id: `${moveKeyPrefix}${folder === null ? '' : toKeyIdentity(folder.id)}`,
                label: path.length > 0 ? path.join(' / ') : topLevel,
            }));
        },
    };
}
/** The folder whose key has this identity (`toKeyIdentity`), or `null` when none has. */
function findFolderByIdentity(folders, identity) {
    const children = (folder) => folder.children;
    for (const folder of walkTree(folders, children)) {
        if (toKeyIdentity(folder.id) === identity)
            return folder;
    }
    return null;
}
function menuOf(context, { canRename, canDelete, deleteReason }) {
    const { props, strings } = context;
    const entries = [];
    if (props.onRename) {
        entries.push({ id: 'rename', label: strings.rename, icon: 'edit', isDisabled: !canRename });
    }
    if (props.onDelete) {
        entries.push({
            id: 'delete',
            label: strings.delete,
            icon: 'delete',
            tone: 'danger',
            isDisabled: !canDelete,
            description: deleteReason ?? undefined,
        });
    }
    // Drag and drop and Alt+Arrow keys move one folder; Move to moves a multiple selection.
    if (props.onMove && props.selectionMode === 'multiple')
        entries.push(moveEntryOf(context));
    return entries;
}
function runMenuAction({ model, props }, key) {
    const id = String(key);
    if (id === 'rename')
        return model.startRename();
    if (id === 'delete')
        return model.remove();
    if (!id.startsWith(moveKeyPrefix))
        return undefined;
    return model.moveTo(findFolderByIdentity(props.folders, id.slice(moveKeyPrefix.length)));
}
/**
 * Manages a folder tree on the library `Tree`: select one folder or several, create one under the
 * selected folder, rename it in place, delete the selected folders, and move them by drag and drop,
 * Alt+Arrow keys or the context menu's Move to. Subfolders can load on demand and a search box can
 * filter the folders. The folders are data and every change goes to a callback, which may return a
 * promise; a rejected promise keeps an edit open with its reason. Actions appear only when their
 * callback is set.
 */
export function FolderManager(props) {
    const strings = useUiStrings();
    const context = { model: useFolderManager(props), props, strings };
    const { model } = context;
    const availability = availabilityOf(context);
    const { message } = model.actions;
    const { className, id, folders, rootLabel, maxDepth, isPending = false, onMove } = props;
    const { selectionMode = 'single', virtualized, rowHeight } = props;
    const label = props['aria-label'];
    return (_jsxs("div", { ...hooks.root({ className, props, data: { pending: model.isBusy } }), id: id, children: [_jsx(FolderToolbar, { ...toolbarOf(context, availability) }), props.filterable ? (_jsx(SearchField, { className: hooks.slotClass('filter'), label: strings.filterLabel(label ?? strings.search), size: "sm", value: model.query, onChange: model.setQuery })) : null, _jsx(FolderTree, { model, folders, rootLabel, maxDepth, isPending, onMove, selectionMode, virtualized, rowHeight, "aria-label": label, "aria-labelledby": props['aria-labelledby'], menuEntries: menuOf(context, availability), onMenuAction: (key) => runMenuAction(context, key) }), message ? (_jsx(InlineError, { id: model.messageId, className: hooks.slotClass('message'), children: message })) : null] }));
}
//# sourceMappingURL=folder-manager.js.map