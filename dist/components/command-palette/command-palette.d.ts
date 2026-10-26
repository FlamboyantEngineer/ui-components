import type { OpenStateProps } from '../../core/events.js';
import type { BaseProps } from '../../core/props.js';
import { type MenuProps, type MenuSize } from '../menu/menu.js';
import type { ShortcutChord } from '../shortcut/shortcut.js';
/** Whether a command whose text is `textValue` matches the typed `inputValue`. */
export type CommandPaletteFilter = (textValue: string, inputValue: string) => boolean;
export interface CommandPaletteProps extends OpenStateProps, Pick<MenuProps, 'items' | 'children' | 'onAction' | 'isLoading' | 'renderEmptyState'>, BaseProps {
    /** Names the dialog. Defaults to the provider's `commandPalette` string. */
    'aria-label'?: string | undefined;
    /** The search field's text, controlled. */
    inputValue?: string | undefined;
    /** The search field's text at each opening, uncontrolled. Defaults to empty. */
    defaultInputValue?: string | undefined;
    /** Called with the search field's text as the reader types. */
    onInputChange?: ((value: string) => void) | undefined;
    /**
     * Keeps the commands whose text matches what was typed. Defaults to a match anywhere in the
     * label, ignoring case and accents; `null` shows the commands as given, already filtered.
     */
    filter?: CommandPaletteFilter | null | undefined;
    /**
     * The chord that opens the palette from anywhere in the document, and closes it from inside.
     * Defaults to `Ctrl+K` (Command+K on macOS); `null` registers none.
     */
    shortcut?: ShortcutChord | null | undefined;
    /** Hints and names the search field. Defaults to the provider's `searchCommands` string. */
    placeholder?: string | undefined;
    /** Row density of the commands. Defaults to `md`. */
    size?: MenuSize | undefined;
}
/**
 * A command palette: a modal dialog holding a search field and the commands it narrows (React Aria
 * `ModalOverlay`, `Dialog`, `Autocomplete` and the library `Menu`). A document-wide chord opens it;
 * running a command, Escape on an empty field or a press outside closes it, and focus returns to
 * where it was.
 */
export declare function CommandPalette({ isOpen, defaultOpen, onOpenChange, shortcut, size, className, ...rest }: CommandPaletteProps): import("react").JSX.Element;
//# sourceMappingURL=command-palette.d.ts.map