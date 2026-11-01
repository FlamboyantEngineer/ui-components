'use client';

import { SearchGlyph } from '../../core/glyphs.js';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
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
import { useLayerZIndex, usePortalContainer } from '../portal/portal.js';
import { AvailableLoadingBoundary, useHoldFocusOnLeave } from '../../core/loading-boundary.js';
import { getDeepActiveElement } from '../../utils/focus-target.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { isChordPress, type ShortcutChord } from '../shortcut/shortcut.js';
import { useDocumentShortcut } from './command-palette-shortcut.js';
import { isComposingKey } from '../../utils/is-composing-key.js';

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
> & {
  /** False while the dialog leaves: its chord then reaches the document and opens it again. */
  isOpen: boolean;
  close: () => void;
};

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
  isOpen,
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
  const dialogRef = useRef<HTMLElement>(null);
  const container = usePortalContainer();
  const [opener] = useState(() => getDeepActiveElement(getOwnerDocument(container)));
  // Closing while the content it was opened from loads, focus waits on that content's boundary.
  useHoldFocusOnLeave(
    () => dialogRef.current,
    () => (isHTMLElement(opener) ? opener : null),
  );
  const menuContext = useMemo(() => ({ onClose: close }), [close]);
  // Seen before the field, which would otherwise keep the key press for itself.
  const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
    // The Enter that confirms an input method candidate runs no command; the input method keeps it.
    if (event.key === 'Enter' && isComposingKey(event.nativeEvent)) {
      event.stopPropagation();
      return;
    }
    if (!isOpen || !shortcut || !isChordPress(event.nativeEvent, shortcut)) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };
  return (
    <Dialog
      ref={dialogRef}
      id={id}
      aria-label={label ?? strings.commandPalette}
      className={hooks.slotClass('dialog')}
      render={(props) => <section {...props} onKeyDownCapture={onKeyDownCapture} />}
    >
      {/* Its own place to work while the page beneath loads. */}
      <AvailableLoadingBoundary>
        <Autocomplete
          inputValue={query}
          onInputChange={setQuery}
          filter={filter === null ? undefined : (filter ?? contains)}
        >
          <SearchField className={hooks.slotClass('search')} aria-label={hint} autoFocus>
            <Glyph icon={SearchGlyph} className={hooks.slotClass('search-icon')} />
            <Input className={hooks.slotClass('search-input')} placeholder={hint} />
          </SearchField>
          <MenuContext value={menuContext}>
            <Menu
              {...menu}
              highlightMatches
              renderEmptyState={() => (
                <span {...hooks.slot('empty')}>{renderEmptyState?.() ?? strings.noResults}</span>
              )}
            />
          </MenuContext>
        </Autocomplete>
      </AvailableLoadingBoundary>
    </Dialog>
  );
}

/**
 * Counts the palette's openings. A dialog keyed by the count starts afresh at each opening, even
 * when the overlay was still leaving and kept the previous dialog mounted.
 */
function useOpening(isOpen: boolean) {
  const [opening, setOpening] = useState({ isOpen, count: 0 });
  if (opening.isOpen !== isOpen) setOpening({ isOpen, count: opening.count + (isOpen ? 1 : 0) });
  return opening.count;
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
  const opening = useOpening(open);
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
          key={opening}
          {...dialogProps}
          shortcut={shortcut}
          size={size}
          isOpen={open}
          close={() => changeOpen(false)}
        />
      </AriaModal>
    </ModalOverlay>
  );
}
