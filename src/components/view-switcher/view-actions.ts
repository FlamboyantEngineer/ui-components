import {
  DeleteGlyph,
  EditGlyph,
  PlusGlyph,
  SaveGlyph,
  StarGlyph,
  UndoGlyph,
} from '../../core/glyphs.js';
import { joinMenuGroups } from '../menu/menu-groups.js';
// The actions a view switcher offers for a view, as menu entries for the actions menu and each
// tab's own menu.

import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { MenuEntry, MenuItemEntry } from '../menu/menu.js';
import type { ViewDialog } from './view-dialogs.js';

/** The callbacks of the actions a view switcher's owner takes. */
export interface ViewActionHandlers {
  onSave?: ((key: Key) => void) | undefined;
  onSaveAs?: ((label: string) => void | Promise<unknown>) | undefined;
  onReset?: ((key: Key) => void) | undefined;
  onRename?: ((key: Key, label: string) => void | Promise<unknown>) | undefined;
  onDelete?: ((key: Key) => void | Promise<unknown>) | undefined;
  onDefaultViewChange?: ((key: Key) => void) | undefined;
}

/** What the actions of one view depend on. */
export interface ViewActionContext {
  handlers: ViewActionHandlers;
  strings: UiStrings;
  selectedKey: Key | null;
  isDirty: boolean;
  defaultViewKey: Key | null;
  /** The only view left cannot be deleted. */
  canDelete: boolean;
  openDialog: (dialog: ViewDialog) => void;
}

/** Save, save as and reset: they act on the current settings, so only on the selected view. */
function listSettingsActions(key: Key, context: ViewActionContext): MenuItemEntry[] {
  const { handlers, strings, isDirty } = context;
  if (key !== context.selectedKey) return [];
  const entries: MenuItemEntry[] = [];
  const { onSave, onSaveAs, onReset } = handlers;
  if (onSave && isDirty) {
    entries.push({ id: 'save', label: strings.save, icon: SaveGlyph, onAction: () => onSave(key) });
  }
  if (onSaveAs) {
    entries.push({
      id: 'save-as',
      label: strings.saveViewAs,
      icon: PlusGlyph,
      onAction: () =>
        context.openDialog({ type: 'save-as', label: '', isOpen: true, onSubmit: onSaveAs }),
    });
  }
  if (onReset && isDirty) {
    entries.push({
      id: 'reset',
      label: strings.resetView,
      icon: UndoGlyph,
      onAction: () => onReset(key),
    });
  }
  return entries;
}

/** The menu entries of a view's actions: its settings, its name and default, then deletion. */
export function listViewActions(key: Key, label: string, context: ViewActionContext): MenuEntry[] {
  const { handlers, strings, openDialog } = context;
  const { onRename, onDefaultViewChange, onDelete } = handlers;
  const naming: MenuItemEntry[] = [];
  if (onRename) {
    naming.push({
      id: 'rename',
      label: strings.rename,
      icon: EditGlyph,
      onAction: () =>
        openDialog({
          type: 'rename',
          label,
          isOpen: true,
          onSubmit: (name) => onRename(key, name),
        }),
    });
  }
  if (onDefaultViewChange && key !== context.defaultViewKey) {
    naming.push({
      id: 'set-default',
      label: strings.setDefaultView,
      icon: StarGlyph,
      onAction: () => onDefaultViewChange(key),
    });
  }
  const removal: MenuItemEntry[] = onDelete
    ? [
        {
          id: 'delete',
          label: strings.delete,
          icon: DeleteGlyph,
          tone: 'danger',
          isDisabled: !context.canDelete,
          onAction: () =>
            openDialog({ type: 'delete', label, isOpen: true, onSubmit: () => onDelete(key) }),
        },
      ]
    : [];
  return joinMenuGroups([listSettingsActions(key, context), naming, removal]);
}
