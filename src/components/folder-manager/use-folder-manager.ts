'use client';

import { useCallback, useId, useMemo, useRef, useState, type RefObject } from 'react';
import type { Key } from '../../core/props.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import type { TreeMove } from '../../utils/tree-reorder.js';
import { splitMatchTerms } from '../text-match/text-match.js';
import { useTreeLoads, type TreeLoads } from '../tree/tree.js';
import {
  buildFolderNodes,
  collectBranchKeys,
  findFolderPath,
  folderDraftKey,
  folderRootKey,
  listSelectedFolders,
  listTopmostFolders,
  toFolderRowKey,
  type FolderItem,
  type FolderNode,
} from './folder-model.js';
import { planFolderMoves } from './folder-moves.js';
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
  type FolderSelectionMode,
  type FolderSelectionOptions,
} from './use-folder-tree.js';

export interface FolderManagerOptions<
  T extends FolderItem,
  M extends FolderSelectionMode = FolderSelectionMode,
>
  extends FolderCallbacks<T>, FolderSelectionOptions<M> {
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
  /**
   * Draws a search box that keeps the folders whose name holds every term, with their ancestors.
   * Without it a query typed before is set aside until it comes back.
   */
  filterable?: boolean | undefined;
  /** The folders are loading: the tree shows a loading row and the actions wait. */
  isPending?: boolean | undefined;
}

export interface FolderManagerModel<T extends FolderItem> {
  nodes: FolderNode<T>[];
  /**
   * The selected rows, by row key: the folders, the root row for no folder, or the draft row while
   * creating.
   */
  selectedRows: Key[];
  /** Selects these folders (none: no folder). */
  select(keys: Key[]): void;
  expansion: FolderExpansion;
  actions: FolderActions<T>;
  loads: TreeLoads;
  /** The selected folders, topmost first, in tree order, leaving out those inside another. */
  selection: T[];
  /** Every selected folder in tree order, those inside another selected folder included. */
  selectedFolders: T[];
  /** The one selected folder and its ancestors, outermost first; empty with none or several. */
  path: T[];
  /** The one selected folder, or `null` with none or several. */
  folder: T | null;
  /** The row key of the row whose label is the name field. */
  editKey: Key | null;
  /** Loading, deleting or naming a folder: other actions wait. */
  isBusy: boolean;
  /** The filter query, as typed. */
  query: string;
  /** The query that filters and marks the folders: the typed one while the search box is drawn. */
  appliedQuery: string;
  setQuery(query: string): void;
  /** The manager's root element: focus inside it is still the manager's. */
  rootRef: RefObject<HTMLDivElement | null>;
  regionRef: RefObject<HTMLDivElement | null>;
  nameRef: RefObject<HTMLInputElement | null>;
  messageId: string;
  startCreate(): void;
  startRename(): void;
  remove(): void;
  /** Moves the selected folders into a folder, or to the top level (`null`). */
  moveTo(destination: T | null): void;
}

/**
 * The filter query, and a setter that expands the branches holding the new matches, the root row
 * included.
 */
function useFolderQuery<T extends FolderItem>(
  folders: readonly T[],
  rootLabel: string | undefined,
  isShown: boolean,
) {
  const [query, setQuery] = useState('');
  // A query outlives its search box when `filterable` turns off; it must not narrow the tree unseen.
  const applied = isShown ? query : '';
  const terms = useMemo(() => splitMatchTerms(applied), [applied]);
  const update = (next: string, expansion: FolderExpansion) => {
    setQuery(next);
    const nextTerms = splitMatchTerms(next);
    if (nextTerms.length === 0) return;
    expansion.reveal(collectBranchKeys(buildFolderNodes(folders, { rootLabel, terms: nextTerms })));
  };
  return { query, applied, terms, update };
}

/** The selected folders: topmost, all of them, and the one folder's path and folder. */
function describeSelection<T extends FolderItem>(folders: readonly T[], selected: readonly Key[]) {
  const keys = new Set(selected);
  const path = selected.length === 1 ? findFolderPath(folders, selected[0] ?? null) : [];
  return {
    selection: listTopmostFolders(folders, keys),
    selectedFolders: listSelectedFolders(folders, keys),
    path,
    folder: path.at(-1) ?? null,
  };
}

/** The row key of a folder, or of the root row for no folder (`null`). */
function toRowKey(key: Key | null): Key {
  return key === null ? folderRootKey : toFolderRowKey(key);
}

/** The selected rows the tree shows: the draft while creating, else the folders or the root row. */
function toSelectedRows(
  selected: Key[],
  editKey: Key | null,
  rootLabel: string | undefined,
): Key[] {
  if (editKey === folderDraftKey) return [folderDraftKey];
  if (selected.length > 0) return selected.map(toFolderRowKey);
  return rootLabel === undefined ? [] : [folderRootKey];
}

/**
 * The folder manager's state: selection, expansion, the filter, loading subfolders, edits,
 * deletes and moves, and focus after each.
 */
export function useFolderManager<T extends FolderItem, M extends FolderSelectionMode>(
  options: FolderManagerOptions<T, M>,
): FolderManagerModel<T> {
  const { folders, rootLabel, isPending = false } = options;
  const messageId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [focusRequest, setFocusRequest] = useState<{ key: Key } | null>(null);
  const [selected, select] = useFolderSelection(options);
  const actions = useFolderActions({
    ...options,
    select: (key) => select(key === null ? [] : [key]),
    onSettle: (key) => setFocusRequest({ key: toRowKey(key) }),
    onRevoke: () => {
      // The name field left with its row, so focus fell to the page or the tree; elsewhere it moved on.
      const active = getOwnerDocument(regionRef.current).activeElement;
      const isInManager = active === null || regionRef.current?.contains(active) === true;
      if (!isInManager && active !== active.ownerDocument.body) return;
      const kept = selected.find((key) => findFolderPath(folders, key).length > 0);
      setFocusRequest({ key: toRowKey(kept ?? null) });
    },
  });
  const clearFocusRequest = useCallback(() => setFocusRequest(null), []);
  useRowFocus({ rootRef, regionRef }, focusRequest, clearFocusRequest);
  const isListed = useCallback((key: Key) => findFolderPath(folders, key).length > 0, [folders]);
  const loads = useTreeLoads(options.onLoadChildren, isListed);
  const { edit } = actions;
  const draftParentKey = edit?.kind === 'create' ? edit.key : undefined;
  const filter = useFolderQuery(folders, rootLabel, options.filterable === true);
  const { terms } = filter;
  const nodes = useMemo(
    () => buildFolderNodes(folders, { rootLabel, draftParentKey, terms }),
    [folders, rootLabel, draftParentKey, terms],
  );
  const expansion = useFolderExpansion(nodes, loads.load);
  const setQuery = (query: string) => filter.update(query, expansion);
  const { selection, selectedFolders, path, folder } = describeSelection(folders, selected);
  const editKey = edit?.kind === 'create' ? folderDraftKey : edit ? toRowKey(edit.key) : null;
  const startEdit = (start: () => void) => {
    // A new edit takes focus itself: a focus request still waiting for its row is dropped.
    clearFocusRequest();
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
    selectedFolders,
    path,
    folder,
    editKey,
    isBusy: isPending || actions.isDeleting || edit !== null,
    query: filter.query,
    appliedQuery: filter.applied,
    setQuery,
    rootRef,
    regionRef,
    nameRef,
    messageId,
    startCreate: () =>
      startEdit(() => {
        expansion.reveal([folderRootKey, ...path.map((entry) => toFolderRowKey(entry.id))]);
        actions.startCreate(folder?.id ?? null);
      }),
    startRename: () => startEdit(() => (folder ? actions.startRename(folder) : undefined)),
    remove: () =>
      selection.length > 0 ? void actions.remove(selection, selectedFolders) : undefined,
    moveTo: (destination) => {
      for (const move of planFolderMoves(folders, selection, destination)) options.onMove?.(move);
      if (destination)
        expansion.reveal(
          findFolderPath(folders, destination.id).map(({ id }) => toFolderRowKey(id)),
        );
    },
  };
}
