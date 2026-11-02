'use client';

import { CloseGlyph, HelpGlyph, RefreshGlyph, RestoreGlyph } from '../../core/glyphs.js';
import { useEffect, useRef } from 'react';
import { getComposedActiveElement } from '../../utils/focus-target.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import type { UiStrings } from '../../core/strings.js';
import {
  ContextMenu,
  useContextMenuTarget,
  useMenuController,
  type ContextMenuTargetProps,
} from '../context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import type { FieldMenuEntry } from './field-menu-entries.js';
import type { FieldState } from './field-state.js';

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
): MenuEntry | null {
  if (entry === 'clear') {
    // A field that can never be cleared does not offer it.
    if (!state.isClearable) return null;
    return { id: entry, label: strings.clear, icon: CloseGlyph, isDisabled: !state.canClear };
  }
  if (entry === 'reset') {
    return {
      id: entry,
      label: strings.resetValue,
      icon: RestoreGlyph,
      isDisabled: !state.isDirty,
    };
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

/** Whether `menu` lists Help, as the built-in action or an entry of its own with the id `help`. */
function hasHelpEntry(menu: readonly FieldMenuEntry[]): boolean {
  return menu.some(
    (entry) => entry === 'help' || (typeof entry === 'object' && entry.id === 'help'),
  );
}

/**
 * The menu a field offers: the caller's, with Help added at the end while the field has help and
 * the menu does not list it yet. A Help the caller lists in a field without help only reports.
 */
function withHelp(menu: readonly FieldMenuEntry[], hasHelp: boolean): readonly FieldMenuEntry[] {
  return hasHelp && !hasHelpEntry(menu) ? [...menu, 'help'] : menu;
}

/**
 * The field menu's entries in the caller's order, with built-in actions applied to the field state
 * before `onMenuAction` hears of any chosen entry. Help, offered whenever the field has help, shows
 * it through `onHelp`.
 */
export function useFieldMenu(
  state: FieldState<unknown>,
  label: string,
  options: {
    menu: readonly FieldMenuEntry[];
    onMenuAction?: ((key: Key) => void) | undefined;
    onHelp?: (() => void) | undefined;
  },
): FieldMenuModel {
  const strings = useUiStrings();
  const entries = withHelp(options.menu, options.onHelp !== undefined)
    .map((entry) => toMenuEntry(entry, state, strings))
    .filter((entry) => entry !== null);
  return {
    label: strings.fieldActions(label),
    entries,
    isDisabled: state.isDisabled || entries.length === 0,
    onAction(key) {
      const apply = { clear: state.clear, reset: state.restore, 'set-default': state.setToDefault };
      if (key === 'clear' || key === 'reset' || key === 'set-default') apply[key]();
      if (key === 'help') options.onHelp?.();
      options.onMenuAction?.(key);
    },
  };
}

/**
 * Makes the field root the field menu's target: a secondary click or long touch anywhere on it, its
 * control's text included, or Shift+F10 or the Context Menu key in it, opens the menu. The root renders the returned menu inside
 * it, so focus in the open menu stays in the field and does not commit its draft. A secondary click
 * from outside the field focuses the control first, so the menu returns focus there on close.
 */
export function useFieldContextMenu(
  model: FieldMenuModel,
  own: ContextMenuTargetProps & { focusControl: () => void },
) {
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const { focusControl, ...ownProps } = own;
  const targetProps = useContextMenuTarget({
    controller,
    isDisabled: model.isDisabled,
    opensInsideText: true,
    own: {
      ...ownProps,
      onContextMenu(event) {
        const root = event.currentTarget;
        const isOpening = !model.isDisabled && !event.defaultPrevented;
        if (isOpening && !root.contains(getComposedActiveElement(root))) focusControl();
      },
    },
    targetRef,
  });
  useEffect(() => {
    if (model.isDisabled) controller.close();
  }, [model.isDisabled, controller]);
  // A field with nothing to offer mounts no menu.
  const menu = model.isDisabled ? null : (
    <ContextMenu controller={controller} triggerRef={targetRef} aria-label={model.label}>
      <Menu items={model.entries} onAction={model.onAction} />
    </ContextMenu>
  );
  return { targetProps, menu };
}
