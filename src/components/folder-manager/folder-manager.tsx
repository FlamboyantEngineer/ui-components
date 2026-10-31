'use client';

import { DeleteGlyph, EditGlyph } from '../../core/glyphs.js';
import { findMaximum } from '../../utils/find-maximum.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { walkTree } from '../../utils/walk-tree.js';
import type { Key, BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { InlineError } from '../inline-error/inline-error.js';
import type { MenuEntry } from '../menu/menu.js';
import { SearchField } from '../search-field/search-field.js';
import {
  FolderToolbar,
  folderManagerHooks as hooks,
  type FolderToolbarProps,
} from './folder-manager-parts.js';
import {
  getFolderHeight,
  listFolderDestinations,
  type FolderDestination,
  type FolderItem,
} from './folder-model.js';
import { FolderTree } from './folder-tree.js';
import type { FolderSelectionMode } from './use-folder-tree.js';
import {
  useFolderManager,
  type FolderManagerModel,
  type FolderManagerOptions,
} from './use-folder-manager.js';

export interface FolderManagerProps<
  T extends FolderItem,
  M extends FolderSelectionMode = FolderSelectionMode,
>
  extends BaseProps, FolderManagerOptions<T, M>, RefProps<HTMLDivElement> {
  /** Names the folder tree. */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  /** Renders only the rows in view; the stylesheet must bound the tree's height. */
  virtualized?: boolean | undefined;
  /** Row height in pixels for a virtualized tree. */
  rowHeight?: number | undefined;
}

interface ToolContext<T extends FolderItem> {
  model: FolderManagerModel<T>;
  props: Omit<FolderManagerProps<T>, 'onSelectionChange'>;
  strings: UiStrings;
}

interface Availability {
  canRename: boolean;
  canDelete: boolean;
  deleteReason: string | null | undefined;
}

/** The key of a Move to entry for a destination: its folder's key, or the top level. */
const moveKeyPrefix = 'move-to:';

function availabilityOf<T extends FolderItem>({ model, props }: ToolContext<T>): Availability {
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

function toolbarOf<T extends FolderItem>(
  { model, props, strings }: ToolContext<T>,
  { canRename, canDelete, deleteReason }: Availability,
): FolderToolbarProps {
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
function destinationsOf<T extends FolderItem>({ model, props }: ToolContext<T>) {
  const moving = new Set(model.selection.map((folder) => folder.id));
  const height = findMaximum(model.selection, getFolderHeight, 0);
  const fits = ({ path }: FolderDestination<T>) =>
    props.maxDepth === undefined || path.length + height <= props.maxDepth;
  return listFolderDestinations(props.folders, moving).filter(fits);
}

function moveEntryOf<T extends FolderItem>(context: ToolContext<T>): MenuEntry {
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
function findFolderByIdentity<T extends FolderItem>(folders: readonly T[], identity: string) {
  const children = (folder: T) => folder.children as readonly T[] | undefined;
  for (const folder of walkTree(folders, children)) {
    if (toKeyIdentity(folder.id) === identity) return folder;
  }
  return null;
}

function menuOf<T extends FolderItem>(
  context: ToolContext<T>,
  { canRename, canDelete, deleteReason }: Availability,
): MenuEntry[] {
  const { props, strings } = context;
  const entries: MenuEntry[] = [];
  if (props.onRename) {
    entries.push({ id: 'rename', label: strings.rename, icon: EditGlyph, isDisabled: !canRename });
  }
  if (props.onDelete) {
    entries.push({
      id: 'delete',
      label: strings.delete,
      icon: DeleteGlyph,
      tone: 'danger',
      isDisabled: !canDelete,
      description: deleteReason ?? undefined,
    });
  }
  // Drag and drop and Alt+Arrow keys move one folder; Move to moves a multiple selection.
  if (props.onMove && props.selectionMode === 'multiple') entries.push(moveEntryOf(context));
  return entries;
}

function runMenuAction<T extends FolderItem>({ model, props }: ToolContext<T>, key: Key) {
  const id = String(key);
  if (id === 'rename') return model.startRename();
  if (id === 'delete') return model.remove();
  if (!id.startsWith(moveKeyPrefix)) return undefined;
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
export function FolderManager<
  T extends FolderItem,
  M extends FolderSelectionMode = FolderSelectionMode,
>(props: FolderManagerProps<T, M>) {
  const strings = useUiStrings();
  const context = { model: useFolderManager(props), props, strings };
  const { model } = context;
  const availability = availabilityOf(context);
  const { message } = model.actions;
  const { className, id, folders, rootLabel, maxDepth, isPending = false, onMove } = props;
  const { selectionMode = 'single', virtualized, rowHeight } = props;
  const label = props['aria-label'];
  return (
    <div
      {...hooks.root({ className, props, data: { pending: model.isBusy } })}
      id={id}
      ref={props.ref}
    >
      <FolderToolbar {...toolbarOf(context, availability)} />
      {props.filterable ? (
        <SearchField
          className={hooks.slotClass('filter')}
          label={strings.filterLabel(label ?? strings.search)}
          size="sm"
          value={model.query}
          onChange={model.setQuery}
        />
      ) : null}
      <FolderTree
        {...{ model, folders, rootLabel, maxDepth, isPending, onMove, selectionMode }}
        {...{ virtualized, rowHeight }}
        aria-label={label}
        aria-labelledby={props['aria-labelledby']}
        menuEntries={menuOf(context, availability)}
        onMenuAction={(key) => runMenuAction(context, key)}
      />
      {message ? (
        <InlineError id={model.messageId} className={hooks.slotClass('message')}>
          {message}
        </InlineError>
      ) : null}
    </div>
  );
}

export type { FolderItem } from './folder-model.js';
