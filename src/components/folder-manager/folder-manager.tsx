import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { InlineError } from '../inline-error/inline-error.js';
import type { MenuEntry } from '../menu/menu.js';
import {
  FolderToolbar,
  folderManagerHooks as hooks,
  type FolderToolbarProps,
} from './folder-manager-parts.js';
import type { FolderItem } from './folder-model.js';
import { FolderTree } from './folder-tree.js';
import {
  useFolderManager,
  type FolderManagerModel,
  type FolderManagerOptions,
} from './use-folder-manager.js';

export interface FolderManagerProps<T extends FolderItem>
  extends BaseProps, FolderManagerOptions<T> {
  /** Names the folder tree. */
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
}

interface ToolContext<T extends FolderItem> {
  model: FolderManagerModel<T>;
  props: FolderManagerProps<T>;
  strings: UiStrings;
}

interface Availability {
  canRename: boolean;
  canDelete: boolean;
  deleteReason: string | null | undefined;
}

function availabilityOf<T extends FolderItem>({ model, props }: ToolContext<T>): Availability {
  const deleteReason = model.folder ? props.getDeleteBlockedReason?.(model.folder) : null;
  const canRename = model.folder !== null && !model.isBusy;
  return { canRename, canDelete: canRename && !deleteReason, deleteReason };
}

function toolbarOf<T extends FolderItem>(
  { model, props, strings }: ToolContext<T>,
  { canRename, canDelete, deleteReason }: Availability,
): FolderToolbarProps {
  const atLimit = props.maxDepth !== undefined && model.path.length >= props.maxDepth;
  return {
    create: {
      isOffered: Boolean(props.onCreate),
      isDisabled: model.isBusy || atLimit,
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
      reason: canRename ? deleteReason : null,
      onPress: model.remove,
    },
  };
}

function menuOf<T extends FolderItem>(
  { props, strings }: ToolContext<T>,
  { canRename, canDelete, deleteReason }: Availability,
): MenuEntry[] {
  const entries: MenuEntry[] = [];
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
  return entries;
}

/**
 * Manages a folder tree on the library `Tree`: select a folder, create one under it, rename it in
 * place, delete it, and reorder or nest folders by drag and drop or Alt+Arrow keys. The folders are
 * data and every change goes to a callback, which may return a promise; a rejected promise keeps an
 * edit open with its reason. New folder, Rename and Delete appear only when their callback is set.
 */
export function FolderManager<T extends FolderItem>(props: FolderManagerProps<T>) {
  const context = { model: useFolderManager(props), props, strings: useUiStrings() };
  const { model } = context;
  const availability = availabilityOf(context);
  const { message } = model.actions;
  const {
    className,
    id,
    folders,
    rootLabel,
    maxDepth,
    isPending = false,
    onMove,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
  } = props;
  return (
    <div {...hooks.root({ className, props, data: { pending: model.isBusy } })} id={id}>
      <FolderToolbar {...toolbarOf(context, availability)} />
      <FolderTree
        {...{ model, folders, rootLabel, maxDepth, isPending, onMove }}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        menuEntries={menuOf(context, availability)}
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
