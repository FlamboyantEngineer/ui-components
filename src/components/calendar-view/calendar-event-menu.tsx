'use client';

// An event's context menu: the built-in Edit, which opens the event editor, and the host's own
// entries (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-5).

import { useEffect, useRef, type KeyboardEvent, type Ref } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import {
  ContextMenu,
  useContextMenuTarget,
  useMenuController,
} from '../context-menu/context-menu.js';
import { Menu, type MenuEntry } from '../menu/menu.js';
import type { CalendarViewEvent } from './calendar-view.js';

/** The built-in event action: open the event editor. */
export type CalendarEventAction = 'edit';

/** The built-in Edit by name, or any menu entry. */
export type CalendarEventMenuEntry = CalendarEventAction | MenuEntry;

/** What an event's menu needs from its calendar. */
export interface CalendarEventMenuContext {
  /** The entries of an event's menu, or a function of the event that returns them. */
  entries:
    | readonly CalendarEventMenuEntry[]
    | ((event: CalendarViewEvent) => readonly CalendarEventMenuEntry[]);
  onAction: ((key: Key, event: CalendarViewEvent) => void) | undefined;
  /** Whether the host lets the reader change the event. */
  isEditable: (event: CalendarViewEvent) => boolean;
  /** Opens the editor on the event. */
  edit: (event: CalendarViewEvent) => void;
}

/** A React Aria keyboard event, which stops propagating unless asked not to. */
type PressableKeyEvent = KeyboardEvent<HTMLElement> & { continuePropagation: () => void };

function readEntries(menu: CalendarEventMenuContext, event: CalendarViewEvent) {
  return typeof menu.entries === 'function' ? menu.entries(event) : menu.entries;
}

/**
 * An event's context menu, on the event's own button: a secondary click or long touch opens it at
 * the pointer, the Context Menu key or Shift+F10 below the event. Edit shows only while the event is
 * editable; the host's entries always. With no entry left the browser's menu stays. The host hears
 * every chosen entry, Edit included, after the editor opened.
 */
export function useEventMenu(
  event: CalendarViewEvent,
  menu: CalendarEventMenuContext | null,
  ownRef: Ref<HTMLElement>,
) {
  const strings = useUiStrings();
  const controller = useMenuController();
  const targetRef = useRef<HTMLElement | null>(null);
  const listed = menu ? readEntries(menu, event) : [];
  const entries = listed.flatMap((entry): MenuEntry[] => {
    if (entry !== 'edit') return [entry];
    return menu?.isEditable(event) ? [{ id: 'edit', label: strings.edit }] : [];
  });
  const isDisabled = entries.length === 0;
  const {
    onKeyDown,
    onKeyDownCapture: _capture,
    ...targetProps
  } = useContextMenuTarget({
    controller,
    isDisabled,
    own: { ref: ownRef },
    targetRef,
  });
  useEffect(() => {
    if (isDisabled) controller.close();
  }, [isDisabled, controller]);
  const element = isDisabled ? null : (
    <ContextMenu
      controller={controller}
      triggerRef={targetRef}
      aria-label={strings.eventActions(event.title)}
    >
      <Menu
        items={entries}
        onAction={(key) => {
          if (key === 'edit') menu?.edit(event);
          menu?.onAction?.(key, event);
        }}
      />
    </ContextMenu>
  );
  return {
    targetProps: {
      ...targetProps,
      // React Aria stops every key a button hears; the grid's day keys must still reach it.
      onKeyDown(keyEvent: PressableKeyEvent) {
        keyEvent.continuePropagation();
        onKeyDown?.(keyEvent);
      },
    },
    menu: element,
  };
}
