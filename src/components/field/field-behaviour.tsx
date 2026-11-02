'use client';

// The field root's behaviour: focus, leaving, undo, form binding, autofocus, its context menu and
// its message tooltip.

import { getComposedActiveElement, isFocusLost } from '../../utils/focus-target.js';
import { useCallback, useContext, useEffect, useRef, useState, type FocusEvent } from 'react';
import { DialogEnteringContext } from '../../utils/dialog-entering.js';
import type { Key } from '../../core/props.js';
import type { SlotRegistry } from '../../utils/slot-registry.js';
import type { FieldMenuEntry } from './field-menu-entries.js';
import { useFieldContextMenu, useFieldMenu } from './field-menu.js';
import { useFieldFocus } from './field-focus.js';
import { focusControl, useFieldFormBinding } from './field-form.js';
import type { FieldState } from './field-state.js';
import { useFieldRoot } from './field-root.js';
import { useFieldUndo } from './field-undo.js';
import { useFieldMessageTooltip, type FieldMessageDisplay } from './field-message-tooltip.js';
import { useFieldHelpTooltip } from './field-help.js';
import { findOwnerDocument } from '../../utils/owner-window.js';
import { usePortalContainer } from '../portal/portal.js';

export type FieldSlots = SlotRegistry<'root' | 'control'>;

/** Focus in the field: leaving it touches the field and, with `commitOnBlur`, commits first. */
function useFieldLeave(state: FieldState<unknown>, slots: FieldSlots, commitOnBlur: boolean) {
  return useFieldFocus({
    getRoot: () => slots.read('root'),
    getControl: () => slots.read('control'),
    onLeave: () => {
      if (commitOnBlur) state.commit();
      state.touch();
    },
  });
}

/**
 * Focuses the control once, when the field mounts with `autoFocus`, unless focus moved to another
 * element while it mounted, such as into a list that opens with the field. Inside a dialog that
 * publishes its entrance, it waits until the dialog has entered (taking focus from the dialog
 * element itself) and focuses without scrolling.
 */
/** The element focused in the tree `container` renders into, or null on the server. */
function readFocused(container: Element | null | undefined): Element | null {
  const owner = findOwnerDocument(container);
  return owner ? getComposedActiveElement(container ?? owner) : null;
}

function useAutoFocus(autoFocus: boolean | undefined, slots: FieldSlots) {
  // The element focused when the field first renders, read before any part can take focus, in the
  // document the field renders into (its portal container's).
  const container = usePortalContainer();
  const [focusedBefore] = useState(() => (autoFocus === true ? readFocused(container) : undefined));
  const isDialogEntering = useContext(DialogEnteringContext);
  const isDone = useRef(false);
  useEffect(() => {
    const control = slots.read('control');
    if (focusedBefore === undefined || !control || isDone.current || isDialogEntering) return;
    isDone.current = true;
    const active = getComposedActiveElement(control);
    const isInDialog = isDialogEntering !== undefined;
    const isOnDialog =
      isInDialog && active !== null && active === control.closest('[role="dialog"]');
    if (active === focusedBefore || isFocusLost(control) || isOnDialog) {
      focusControl(control, isInDialog ? { preventScroll: true } : undefined);
    }
  }, [focusedBefore, slots, isDialogEntering]);
}

interface FieldBehaviourOptions {
  label: string;
  menu: readonly FieldMenuEntry[];
  onMenuAction: ((key: Key) => void) | undefined;
  commitOnBlur: boolean;
  autoFocus: boolean | undefined;
  messageDisplay: FieldMessageDisplay;
  /** The field has help, which its menu offers. */
  hasHelp: boolean;
}

/**
 * Everything the field root does besides drawing its parts: the props its element takes, whether
 * focus is in it, its context menu element and whether its message tooltip is open.
 */
export function useFieldBehaviour(
  state: FieldState<unknown>,
  slots: FieldSlots,
  options: FieldBehaviourOptions,
) {
  const getRoot = useCallback(() => slots.read('root'), [slots]);
  useFieldRoot(getRoot);
  const onKeyDown = useFieldUndo(getRoot, state);
  const focus = useFieldLeave(state, slots, options.commitOnBlur);
  useFieldFormBinding(state, slots, options.label);
  useAutoFocus(options.autoFocus, slots);
  const help = useFieldHelpTooltip(
    { hasHelp: options.hasHelp, isFocused: focus.isFocused, isDisabled: state.isDisabled },
    getRoot,
  );
  const menuModel = useFieldMenu(state, options.label, {
    ...options,
    onHelp: options.hasHelp ? help.open : undefined,
  });
  const tooltip = useFieldMessageTooltip(
    options.messageDisplay,
    state.validation.message ?? null,
    focus.isFocused,
  );
  const contextMenu = useFieldContextMenu(menuModel, {
    ref: slots.ref('root'),
    onKeyDown: (event) => {
      onKeyDown(event);
      tooltip.onKeyDown(event);
    },
    focusControl: () => focusControl(slots.read('control')),
  });
  return {
    isFocused: focus.isFocused,
    isTooltipOpen: tooltip.isOpen,
    help,
    getRoot,
    menu: contextMenu.menu,
    rootProps: {
      ...contextMenu.targetProps,
      ...tooltip.rootProps,
      onKeyDownCapture: help.onKeyDownCapture,
      onFocus: (event: FocusEvent) => {
        if (!focus.isFocused) tooltip.onEnter();
        focus.onFocus(event);
      },
      onBlur: focus.onBlur,
    },
  };
}
