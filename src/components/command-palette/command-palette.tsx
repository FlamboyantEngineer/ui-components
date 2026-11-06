'use client';

import { type KeyboardEvent, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { OpenStateProps } from '../../core/events.js';
import { SearchGlyph } from '../../core/glyphs.js';
import { splitDataAttributes } from '../../core/hooks.js';
import { AvailableLoadingBoundary, useHoldFocusOnLeave } from '../../core/loading-boundary.js';
import type { BaseProps, Key, RefProps } from '../../core/props.js';
import { Glyph, useUiStrings } from '../../core/provider.js';
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
import { getDeepActiveElement } from '../../utils/focus-target.js';
import { isComposingKey } from '../../utils/is-composing-key.js';
import { isHTMLElement } from '../../utils/is-element.js';
import { getOwnerDocument } from '../../utils/owner-window.js';
import { useMergedRefs } from '../../utils/use-merged-refs.js';
import { Menu, type MenuProps, type MenuSize } from '../menu/menu.js';
import { useLayerZIndex, usePortalContainer } from '../portal/portal.js';
import { isChordPress, type ShortcutChord } from '../shortcut/shortcut.js';
import type { CommandPaletteEntry, CommandPaletteFilter } from './command-palette-entries.js';
import { useReturnFocusOnClose } from './command-palette-focus.js';
import { commandPaletteHooks as hooks } from './command-palette-hooks.js';
import { CommandPageHeader, useCommandPages } from './command-palette-pages.js';
import { useDocumentShortcut } from './command-palette-shortcut.js';

export type {
  CommandPaletteEntry,
  CommandPaletteFilter,
  CommandPaletteItem,
  CommandPaletteSection,
} from './command-palette-entries.js';

export interface CommandPaletteProps
  extends
    RefProps<HTMLDivElement>,
    OpenStateProps,
    Pick<MenuProps, 'children' | 'onAction' | 'isLoading' | 'renderEmptyState'>,
    BaseProps {
  /**
   * The commands as data, used when there are no `children`: menu entries whose commands may carry
   * search `keywords` and open a page of further `commands`.
   */
  items?: readonly CommandPaletteEntry[] | undefined;
  /** The ids of the branch commands opened from the first page, controlled. */
  path?: readonly Key[] | undefined;
  /** The page path each opening starts from, uncontrolled. Defaults to the first page. */
  defaultPath?: readonly Key[] | undefined;
  /** Called with the new page path when the reader opens a page or goes back. */
  onPathChange?: ((path: Key[]) => void) | undefined;
  /** Names the dialog. Defaults to the provider's `commandPalette` string. */
  'aria-label'?: string | undefined;
  /** The search field's text, controlled. */
  inputValue?: string | undefined;
  /** The search field's text at each opening, uncontrolled. Defaults to empty. */
  defaultInputValue?: string | undefined;
  /** Called with the search field's text as the reader types. */
  onInputChange?: ((value: string) => void) | undefined;
  /**
   * Keeps the commands whose label or a keyword matches what was typed, in their order. Defaults to
   * ranking the matches, ignoring case and accents; `null` shows the commands as given, already
   * filtered.
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
  items,
  path,
  defaultPath,
  onPathChange,
  onAction,
  ...menu
}: CommandPaletteDialogProps) {
  const strings = useUiStrings();
  const { contains } = useFilter({ sensitivity: 'base' });
  const [query, setQuery] = useControllableState(
    inputValue,
    defaultInputValue ?? '',
    onInputChange,
  );
  const pages = useCommandPages({
    ...{ items, path, defaultPath, onPathChange, query, setQuery, filter, onAction },
  });
  const hint = placeholder ?? strings.searchCommands;
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = usePageFocus(pages.pages.length);
  const container = usePortalContainer();
  const [opener] = useState(() => getDeepActiveElement(getOwnerDocument(container)));
  // Closing while the content it was opened from loads, focus waits on that content's boundary.
  useHoldFocusOnLeave(
    () => dialogRef.current,
    () => (isHTMLElement(opener) ? opener : null),
  );
  const menuContext = useMemo(() => ({ onClose: close }), [close]);
  const onKeyDownCapture = createDialogKeys({ isOpen, shortcut, close, pages });
  const pageLabel = pages.pages.at(-1)?.label;
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
        <CommandPageHeader pages={pages.pages} onBack={pages.back} />
        <Autocomplete
          inputValue={query}
          onInputChange={setQuery}
          filter={pages.usesOwnFilter && filter !== null ? (filter ?? contains) : undefined}
        >
          <SearchField className={hooks.slotClass('search')} aria-label={hint} autoFocus>
            <Glyph icon={SearchGlyph} className={hooks.slotClass('search-icon')} />
            <Input ref={inputRef} className={hooks.slotClass('search-input')} placeholder={hint} />
          </SearchField>
          <MenuContext value={menuContext}>
            <Menu
              {...menu}
              aria-label={pageLabel}
              items={pages.menuItems}
              onAction={pages.onAction}
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
 * The dialog's keys, seen before the field, which would otherwise keep them: the Enter that
 * confirms an input method candidate runs no command, Escape and Backspace on an empty field of an
 * inner page go back, and the palette's chord closes it.
 */
function createDialogKeys(options: {
  isOpen: boolean;
  shortcut: ShortcutChord | null | undefined;
  close: () => void;
  pages: { onKeyDownCapture: (event: KeyboardEvent<HTMLElement>) => void };
}) {
  const { isOpen, shortcut, close, pages } = options;
  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' && isComposingKey(event.nativeEvent)) {
      event.stopPropagation();
      return;
    }
    pages.onKeyDownCapture(event);
    if (event.isPropagationStopped()) return;
    if (!isOpen || !shortcut || !isChordPress(event.nativeEvent, shortcut)) return;
    event.preventDefault();
    event.stopPropagation();
    close();
  };
}

/** Returns focus to the search field after the reader opens a page or goes back. */
function usePageFocus(depth: number) {
  const inputRef = useRef<HTMLInputElement>(null);
  const depthRef = useRef(depth);
  useLayoutEffect(() => {
    if (depthRef.current === depth) return;
    depthRef.current = depth;
    inputRef.current?.focus();
  }, [depth]);
  return inputRef;
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
  ref,
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
  const overlayRef = useRef<HTMLDivElement>(null);
  useReturnFocusOnClose(open, overlayRef);
  const rootRefs = useMergedRefs(overlayRef, ref);
  return (
    <ModalOverlay
      ref={rootRefs}
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
