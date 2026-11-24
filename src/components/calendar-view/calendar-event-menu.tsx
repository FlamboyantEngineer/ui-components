'use client';

// An event's context menu: the built-in Edit, which requests host editing, and the host's own
// entries (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-5).

import type { KeyboardEvent, Ref } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useItemContextMenu } from '../context-menu/context-menu.js';
import type { MenuEntry } from '../menu/menu.js';
import { type MenuActionIcons, resolveActionIcon } from '../menu/menu-action-icons.js';
import type { CalendarViewEvent } from './calendar-view.js';

/** The built-in event action: request host editing. */
export type CalendarEventAction = 'edit';

/** Icons for the event menu's built-in actions, by action; Edit has none by default. */
export type CalendarEventMenuIcons = MenuActionIcons<CalendarEventAction>;

/** The built-in Edit by name, or any menu entry. */
export type CalendarEventMenuEntry = CalendarEventAction | MenuEntry;

/** What an event's menu needs from its calendar. */
export interface CalendarEventMenuContext {
  /** The entries of an event's menu, or a function of the event that returns them. */
  entries:
    | readonly CalendarEventMenuEntry[]
    | ((event: CalendarViewEvent) => readonly CalendarEventMenuEntry[]);
  onAction: ((key: Key, event: CalendarViewEvent) => void) | undefined;
  icons: CalendarEventMenuIcons | undefined;
  /** Whether the host lets the reader change the event. */
  isEditable: (event: CalendarViewEvent) => boolean;
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
 * every chosen entry, Edit included, through the host callback.
 */
export function useEventMenu(
  event: CalendarViewEvent,
  menu: CalendarEventMenuContext | null,
  ownRef: Ref<HTMLElement>,
) {
  const strings = useUiStrings();
  const listed = menu ? readEntries(menu, event) : [];
  const entries = listed.flatMap((entry): MenuEntry[] => {
    if (entry !== 'edit') return [entry];
    if (!menu?.isEditable(event)) return [];
    return [{ id: 'edit', label: strings.edit, icon: resolveActionIcon(menu.icons, 'edit') }];
  });
  const {
    targetProps: { onKeyDown, onKeyDownCapture: _capture, ...targetProps },
    menu: element,
  } = useItemContextMenu({
    entries,
    getLabel: () => strings.eventActions(event.title),
    own: { ref: ownRef },
    onAction: (key) => menu?.onAction?.(key, event),
  });
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
