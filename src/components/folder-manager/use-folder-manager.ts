import { useCallback, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { Key } from 'react-aria-components';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { splitMatchTerms } from '../text-match/text-match.js';
import {
  buildFolderNodes,
  collectBranchKeys,
  findFolderPath,
  folderDraftKey,
  folderRootKey,
  listTopmostFolders,
  type FolderItem,
  type FolderNode,
} from './folder-model.js';
import { planFolderMoves } from './folder-moves.js';
import {
  useFolderActions,
  type FolderActions,
  type FolderCallbacks,
} from './use-folder-actions.js';
import { useFolderLoads, type FolderLoads } from './use-folder-loads.js';
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
  /** Loads the subfolders of a folder with `hasChildren`; it may return a promise. */
  onLoadChildren?: ((key: Key) => unknown) | undefined;
  /** The deepest a folder may sit, the top level being 1. No limit without. */
  maxDepth?: number | undefined;
  /** The folders are loading: the tree shows a loading row and the actions wait. */
  isPending?: boolean | undefined;
}

export interface FolderManagerModel<T extends FolderItem> {
  nodes: FolderNode<T>[];
  /** The selected rows: the folders, the root row for no folder, or the draft row while creating. */
  selectedRows: Key[];
  /** Selects these folders (none: no folder). */
  select(keys: Key[]): void;
  expansion: FolderExpansion;
  actions: FolderActions<T>;
  loads: FolderLoads;
  /** The selected folders, topmost first, in tree order. */
  selection: T[];
  /** The one selected folder and its ancestors, outermost first; empty with none or several. */
  path: T[];
  /** The one selected folder, or `null` with none or several. */
  folder: T | null;
  /** The row whose label is the name field. */
  editKey: Key | null;
  /** Loading, deleting or naming a folder: other actions wait. */
  isBusy: boolean;
  /** The filter query, as typed. */
  query: string;
  setQuery(query: string): void;
  regionRef: RefObject<HTMLDivElement | null>;
  nameRef: RefObject<HTMLInputElement | null>;
  messageId: string;
  startCreate(): void;
  startRename(): void;
  remove(): void;
  /** Moves the selected folders into a folder, or to the top level (`null`). */
  moveTo(destination: T | null): void;
}

/** The filter query, and a setter that expands the branches holding the new matches. */
function useFolderQuery<T extends FolderItem>(folders: readonly T[]) {
  const [query, setQuery] = useState('');
  const terms = useMemo(() => splitMatchTerms(query), [query]);
  const update = (next: string, expansion: FolderExpansion) => {
    setQuery(next);
    const nextTerms = splitMatchTerms(next);
    if (nextTerms.length === 0) return;
    expansion.reveal(collectBranchKeys(buildFolderNodes(folders, { terms: nextTerms })));
  };
  return { query, terms, update };
}

/** The selected rows the tree shows: the draft while creating, else the folders or the root row. */
function toSelectedRows(
  selected: Key[],
  editKey: Key | null,
  rootLabel: string | undefined,
): Key[] {
  if (editKey === folderDraftKey) return [folderDraftKey];
  if (selected.length > 0) return selected;
  return rootLabel === undefined ? [] : [folderRootKey];
}

/**
 * The folder manager's state: selection, expansion, the filter, loading subfolders, edits,
 * deletes and moves, and focus after each.
 */
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
    select: (key) => select(key === null ? [] : [key]),
    onSettle: (key) => setFocusRequest({ key: key ?? folderRootKey }),
  });
  const clearFocusRequest = useCallback(() => setFocusRequest(null), []);
  useRowFocus(regionRef, focusRequest, clearFocusRequest);
  const loads = useFolderLoads(options.onLoadChildren);
  const { edit } = actions;
  const draftParentKey = edit?.kind === 'create' ? edit.key : undefined;
  const filter = useFolderQuery(folders);
  const { terms } = filter;
  const nodes = useMemo(
    () => buildFolderNodes(folders, { rootLabel, draftParentKey, terms }),
    [folders, rootLabel, draftParentKey, terms],
  );
  const expansion = useFolderExpansion(nodes, loads.load);
  const setQuery = (query: string) => filter.update(query, expansion);
  const selection = listTopmostFolders(folders, new Set(selected));
  const path = selected.length === 1 ? findFolderPath(folders, selected[0] ?? null) : [];
  const folder = path.at(-1) ?? null;
  const editKey = edit?.kind === 'create' ? folderDraftKey : (edit?.key ?? null);
  const startEdit = (start: () => void) => {
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
    startCreate: () =>
      startEdit(() => {
        expansion.reveal([folderRootKey, ...path.map((entry) => entry.id)]);
        actions.startCreate(folder?.id ?? null);
      }),
    startRename: () => startEdit(() => (folder ? actions.startRename(folder) : undefined)),
    remove: () => (selection.length > 0 ? void actions.remove(selection) : undefined),
    moveTo: (destination) => {
      for (const move of planFolderMoves(folders, selection, destination)) options.onMove?.(move);
      if (destination)
        expansion.reveal([...findFolderPath(folders, destination.id).map(({ id }) => id)]);
    },
  };
}
