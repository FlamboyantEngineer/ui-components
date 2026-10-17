import { useCallback, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { Key } from 'react-aria-components';
import type { TreeMove } from '../../utils/tree-reorder.js';
import {
  buildFolderNodes,
  findFolderPath,
  folderDraftKey,
  folderRootKey,
  type FolderItem,
  type FolderNode,
} from './folder-model.js';
import {
  useFolderActions,
  type FolderActions,
  type FolderCallbacks,
} from './use-folder-actions.js';
import {
  useFolderExpansion,
  useFolderSelection,
  useRowFocus,
  type FolderExpansion,
  type FolderSelectionOptions,
} from './use-folder-tree.js';

export interface FolderManagerOptions<T extends FolderItem>
  extends FolderCallbacks<T>, FolderSelectionOptions {
  /** The folders, nested. The manager never changes them: callbacks report each change. */
  folders: readonly T[];
  /** Shows a root row with this label above the folders, standing for no folder (`null`). */
  rootLabel?: string | undefined;
  /** Lets the reader reorder and nest folders; each move is reported here for the owner to apply. */
  onMove?: ((move: TreeMove) => void) | undefined;
  /** The deepest a folder may sit, the top level being 1. No limit without. */
  maxDepth?: number | undefined;
  /** The folders are loading: the tree shows a loading row and the actions wait. */
  isPending?: boolean | undefined;
}

export interface FolderManagerModel<T extends FolderItem> {
  nodes: FolderNode<T>[];
  /** The selected row: the folder, the root row for no folder, or the draft row while creating. */
  selectedRow: Key | null;
  select(key: Key | null): void;
  expansion: FolderExpansion;
  actions: FolderActions<T>;
  /** The selected folder and its ancestors, outermost first. */
  path: T[];
  folder: T | null;
  /** The row whose label is the name field. */
  editKey: Key | null;
  /** Loading, deleting or naming a folder: other actions wait. */
  isBusy: boolean;
  regionRef: RefObject<HTMLDivElement | null>;
  nameRef: RefObject<HTMLInputElement | null>;
  messageId: string;
  startCreate(): void;
  startRename(): void;
  remove(): void;
}

/** The folder manager's state: selection, expansion, edits, deletes and focus after each. */
export function useFolderManager<T extends FolderItem>(
  options: FolderManagerOptions<T>,
): FolderManagerModel<T> {
  const { folders, rootLabel, isPending = false } = options;
  const messageId = useId();
  const regionRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [focusRequest, setFocusRequest] = useState<{ key: Key } | null>(null);
  const [selected, select] = useFolderSelection(options);
  const actions = useFolderActions({
    ...options,
    select,
    onSettle: (key) => setFocusRequest({ key: key ?? folderRootKey }),
  });
  const clearFocusRequest = useCallback(() => setFocusRequest(null), []);
  useRowFocus(regionRef, focusRequest, clearFocusRequest);
  const { edit } = actions;
  const draftParentKey = edit?.kind === 'create' ? edit.key : undefined;
  const nodes = useMemo(
    () => buildFolderNodes(folders, { rootLabel, draftParentKey }),
    [folders, rootLabel, draftParentKey],
  );
  const expansion = useFolderExpansion(nodes);
  const path = findFolderPath(folders, selected);
  const folder = path.at(-1) ?? null;
  const editKey = edit?.kind === 'create' ? folderDraftKey : (edit?.key ?? null);
  const restingRow = rootLabel === undefined ? null : folderRootKey;
  return {
    nodes,
    selectedRow: editKey === folderDraftKey ? folderDraftKey : (folder?.id ?? restingRow),
    select,
    expansion,
    actions,
    path,
    folder,
    editKey,
    isBusy: isPending || actions.isDeleting || edit !== null,
    regionRef,
    nameRef,
    messageId,
    startCreate: () => {
      expansion.reveal([folderRootKey, ...path.map((entry) => entry.id)]);
      actions.startCreate(folder?.id ?? null);
    },
    startRename: () => (folder ? actions.startRename(folder) : undefined),
    remove: () => (folder ? void actions.remove(folder) : undefined),
  };
}
