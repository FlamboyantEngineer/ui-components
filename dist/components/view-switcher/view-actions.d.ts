import type { Key } from '../../core/props.js';
import type { UiStrings } from '../../core/strings.js';
import type { MenuEntry } from '../menu/menu.js';
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
/** The menu entries of a view's actions: its settings, its name and default, then deletion. */
export declare function listViewActions(key: Key, label: string, context: ViewActionContext): MenuEntry[];
//# sourceMappingURL=view-actions.d.ts.map