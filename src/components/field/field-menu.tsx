'use client';

import { CloseGlyph, HelpGlyph, RefreshGlyph } from '../../core/glyphs.js';
import type { ReactElement } from 'react';
import type { ControlSize, Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import { ContextMenuTrigger } from '../context-menu/context-menu.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import type { FieldState } from './field-state.js';

/** A built-in field menu action: Clear, Set to default or Help. */
export type FieldMenuAction = 'clear' | 'set-default' | 'help';

/** A built-in action by name, or any menu entry. */
export type FieldMenuEntry = FieldMenuAction | MenuEntry;

export interface FieldMenuModel {
  /** The accessible name of both menus. */
  label: string;
  entries: MenuEntry[];
  onAction: (key: Key) => void;
  isDisabled: boolean;
}

function toMenuEntry(
  entry: FieldMenuEntry,
  state: FieldState<unknown>,
  strings: UiStrings,
): MenuEntry {
  if (entry === 'clear') {
    return { id: entry, label: strings.clear, icon: CloseGlyph, isDisabled: !state.canClear };
  }
  if (entry === 'set-default') {
    return {
      id: entry,
      label: strings.setDefault,
      icon: RefreshGlyph,
      isDisabled: !state.canSetDefault,
    };
  }
  if (entry === 'help') return { id: entry, label: strings.help, icon: HelpGlyph };
  return entry;
}

/**
 * The field menu's entries in the caller's order, with built-in actions applied to the field state
 * before `onMenuAction` hears of any chosen entry.
 */
export function useFieldMenu(
  state: FieldState<unknown>,
  label: string,
  options: { menu: readonly FieldMenuEntry[]; onMenuAction?: ((key: Key) => void) | undefined },
): FieldMenuModel {
  const strings = useUiStrings();
  return {
    label: strings.fieldActions(label),
    entries: options.menu.map((entry) => toMenuEntry(entry, state, strings)),
    isDisabled: state.isDisabled || options.menu.length === 0,
    onAction(key) {
      if (key === 'clear') state.clear();
      if (key === 'set-default') state.setToDefault();
      options.onMenuAction?.(key);
    },
  };
}

/** The field's menu button. */
export function FieldMenuButton({
  model,
  size,
  className,
}: {
  model: FieldMenuModel;
  size: ControlSize;
  className: string;
}) {
  return (
    <DropdownMenu
      iconOnly
      label={model.label}
      size={size}
      menuSize="md"
      className={className}
      items={model.entries}
      onAction={model.onAction}
      isDisabled={model.isDisabled}
    />
  );
}

/** Opens the field menu on a secondary click, a long touch, Shift+F10 or the Context Menu key. */
export function FieldContextMenu({
  model,
  children,
}: {
  model: FieldMenuModel;
  children: ReactElement;
}) {
  return (
    <ContextMenuTrigger isDisabled={model.isDisabled} aria-label={model.label}>
      {children}
      <Menu items={model.entries} onAction={model.onAction} />
    </ContextMenuTrigger>
  );
}
