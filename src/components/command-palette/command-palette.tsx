import type { KeyboardEvent } from 'react';
import {
  Autocomplete,
  Dialog,
  Input,
  MenuContext,
  Modal as AriaModal,
  ModalOverlay,
  SearchField,
  useFilter,
} from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps } from '../../core/events.js';
import { createHooks, splitDataAttributes } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
import { Menu, type MenuProps, type MenuSize } from '../menu/menu.js';
import { useLayerZIndex } from '../portal/portal.js';
import { isChordPress, type ShortcutChord } from '../shortcut/shortcut.js';
import { useDocumentShortcut } from './command-palette-shortcut.js';

/** Whether a command whose text is `textValue` matches the typed `inputValue`. */
export type CommandPaletteFilter = (textValue: string, inputValue: string) => boolean;

export interface CommandPaletteProps
  extends
    OpenStateProps,
    Pick<MenuProps, 'items' | 'children' | 'onAction' | 'isLoading' | 'renderEmptyState'>,
    BaseProps {
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

type CommandPaletteDialogProps = Omit<
  CommandPaletteProps,
  'isOpen' | 'defaultOpen' | 'onOpenChange' | 'className' | `data-${string}`
> & { close: () => void };

const hooks = createHooks('command-palette', [
  'panel',
  'dialog',
  'search',
  'search-icon',
  'search-input',
  'empty',
]);

/**
 * The dialog: a search field over a menu of commands (React Aria `Autocomplete`). Focus stays in
 * the field while the arrow keys move through the commands; each opening starts from
 * `defaultInputValue`.
 */
function CommandPaletteDialog({
  id,
  'aria-label': label,
  inputValue,
  defaultInputValue,
  onInputChange,
  filter,
  shortcut,
  placeholder,
  renderEmptyState,
  close,
  ...menu
}: CommandPaletteDialogProps) {
  const strings = useUiStrings();
  const { contains } = useFilter({ sensitivity: 'base' });
  const [query, setQuery] = useControllableState(
    inputValue,
    defaultInputValue ?? '',
    onInputChange,
  );
  const hint = placeholder ?? strings.searchCommands;
  // Seen before the field, which would otherwise keep the key press for itself.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    if (!shortcut || !isChordPress(event.nativeEvent, shortcut)) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };
  return (
    <Dialog
      id={id}
      aria-label={label ?? strings.commandPalette}
      className={hooks.slotClass('dialog')}
      render={(props) => <section {...props} onKeyDownCapture={onKeyDownCapture} />}
    >
      <Autocomplete
        inputValue={query}
        onInputChange={setQuery}
        filter={filter === null ? undefined : (filter ?? contains)}
      >
        <SearchField className={hooks.slotClass('search')} aria-label={hint} autoFocus>
          <Glyph name="search" className={hooks.slotClass('search-icon')} />
          <Input className={hooks.slotClass('search-input')} placeholder={hint} />
        </SearchField>
        <MenuContext.Provider value={{ onClose: close }}>
          <Menu
            {...menu}
            highlightMatches
            renderEmptyState={() => (
              <span {...hooks.slot('empty')}>{renderEmptyState?.() ?? strings.noResults}</span>
            )}
          />
        </MenuContext.Provider>
      </Autocomplete>
    </Dialog>
  );
}

/**
 * A command palette: a modal dialog holding a search field and the commands it narrows (React Aria
 * `ModalOverlay`, `Dialog`, `Autocomplete` and the library `Menu`). A document-wide chord opens it;
 * running a command, Escape on an empty field or a press outside closes it, and focus returns to
 * where it was.
 */
export function CommandPalette({
  isOpen,
  defaultOpen,
  onOpenChange,
  shortcut = 'Ctrl+K',
  size = 'md',
  className,
  ...rest
}: CommandPaletteProps) {
  const [open, setOpen] = useControllableState(isOpen, defaultOpen ?? false, onOpenChange);
  const zIndex = useLayerZIndex('modal');
  const [, dialogProps] = splitDataAttributes(rest);
  const changeOpen = (next: boolean) => {
    if (next !== open) setOpen(next);
  };
  useDocumentShortcut(shortcut, () => changeOpen(true));
  return (
    <ModalOverlay
      {...hooks.root({ className, props: rest, data: { layer: 'modal', size } })}
      isOpen={open}
      onOpenChange={changeOpen}
      isDismissable
      style={{ position: 'fixed', inset: 0, zIndex }}
    >
      <AriaModal className={hooks.slotClass('panel')}>
        <CommandPaletteDialog
          {...dialogProps}
          shortcut={shortcut}
          size={size}
          close={() => changeOpen(false)}
        />
      </AriaModal>
    </ModalOverlay>
  );
}
