'use client';

// The event editor: a modal that edits an event's title, all-day state, start and end, and hands
// the changed event to the host (specs/CALENDAR-VIEW.md, UIC-CALENDAR-VIEW-5.2).

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Checkbox } from '../checkbox/checkbox.js';
import { DateTimeField } from '../date-time-field/date-time-field.js';
import { Modal } from '../modal/modal.js';
import { TextField } from '../text-field/text-field.js';
import type { CalendarEventMenuContext } from './calendar-event-menu.js';
import {
  applyEdit,
  convertRange,
  type EventRange,
  isOrderedRange,
  toEventRange,
} from './calendar-event-range.js';
import { type PlacedEvent, readEvents } from './calendar-layout.js';
import type { CalendarViewEvent } from './calendar-view.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';

/** The reader's changes, field by field; a field left alone shows the event's current value. */
interface EventDraft {
  title?: string;
  isAllDay?: boolean;
  range?: EventRange | null;
}

interface EditorProps {
  placed: PlacedEvent;
  isOpen: boolean;
  draft: EventDraft;
  onDraftChange: (draft: EventDraft) => void;
  timeZone: string;
  onSave: (next: CalendarViewEvent, previous: CalendarViewEvent) => void;
  onClose: () => void;
  /** Where focus goes once the editor closes. */
  finalFocus: () => HTMLElement | null;
}

/** The values the editor shows: the reader's draft over the event's current values. */
function readValues(placed: PlacedEvent, draft: EventDraft, timeZone: string) {
  const title = draft.title ?? placed.event.title;
  const isAllDay = draft.isAllDay ?? placed.isAllDay;
  const range = draft.range === undefined ? toEventRange(placed, isAllDay, timeZone) : draft.range;
  const isValid =
    title.trim() !== '' && range !== null && isOrderedRange(range, isAllDay, timeZone);
  return { title, isAllDay, range, isValid };
}

/**
 * The editor of one event. Save hands the host the event with the title, all-day state and range,
 * while the title is not blank and the range ends no earlier than it starts; Cancel and Escape keep
 * the event as it was.
 */
function CalendarEventEditor({
  placed,
  isOpen,
  draft,
  onDraftChange,
  timeZone,
  onSave,
  onClose,
  finalFocus,
}: EditorProps) {
  const strings = useUiStrings();
  const { title, isAllDay, range, isValid } = readValues(placed, draft, timeZone);
  const save = () => {
    if (!isValid || !range) return;
    onSave(
      applyEdit(placed.event, { title: title.trim(), isAllDay, range }, timeZone),
      placed.event,
    );
  };
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={strings.editEvent}
      finalFocus={finalFocus}
      className={hooks.slotClass('editor')}
      bodyLayout="column"
      primaryAction={{
        label: strings.save,
        isDisabled: !isValid,
        onPress: (close) => {
          save();
          close();
        },
      }}
    >
      <TextField
        label={strings.eventTitle}
        value={title}
        onChange={(next) => onDraftChange({ ...draft, title: next })}
        isRequired
      />
      <Checkbox
        isSelected={isAllDay}
        onChange={(next) =>
          onDraftChange({
            ...draft,
            isAllDay: next,
            range: draft.range ? convertRange(draft.range, next, timeZone) : undefined,
          })
        }
      >
        {strings.allDay}
      </Checkbox>
      {isAllDay ? (
        <DateTimeField
          key="date-range"
          mode="date-range"
          label={strings.eventWhen}
          value={range}
          onChange={(next) => onDraftChange({ ...draft, range: next })}
          isRequired
        />
      ) : (
        <DateTimeField
          key="date-time-range"
          mode="date-time-range"
          label={strings.eventWhen}
          timeZone={timeZone}
          value={range}
          onChange={(next) => onDraftChange({ ...draft, range: next })}
          isRequired
        />
      )}
    </Modal>
  );
}

/** The event buttons on show, by event: the editor gives focus back to one when it closes. */
function useEventButtons() {
  const buttons = useRef(new Map<string, Set<HTMLElement>>());
  const register = useCallback((id: Key, element: HTMLElement) => {
    const identity = toKeyIdentity(id);
    const known = buttons.current.get(identity) ?? new Set();
    known.add(element);
    buttons.current.set(identity, known);
    return () => {
      known.delete(element);
      if (known.size === 0 && buttons.current.get(identity) === known) {
        buttons.current.delete(identity);
      }
    };
  }, []);
  const find = (id: Key) =>
    [...(buttons.current.get(toKeyIdentity(id)) ?? [])].find((element) => element.isConnected) ??
    null;
  return { register, find };
}

interface EventEditingOptions {
  events: readonly PlacedEvent[];
  timeZone: string;
  onEventChange: ((next: CalendarViewEvent, previous: CalendarViewEvent) => void) | undefined;
  eventMenu: CalendarEventMenuContext['entries'];
  onEventMenuAction: CalendarEventMenuContext['onAction'];
  eventMenuIcons: CalendarEventMenuContext['icons'];
  /** Whether the host lets the reader edit the event. */
  isEditable: (event: CalendarViewEvent) => boolean;
  /** The focused day's cell, where focus goes when the edited event left the view. */
  findDayCell: () => HTMLElement | null;
  /** Shows the day a saved event now starts on, when it moved. */
  onMoved: (day: string) => void;
}

/**
 * The calendar's event menus and editor: the menu options every event button reads, a registry of
 * the buttons on show, and the editor of the event Edit opened. The editor follows the event by its
 * key: it shows the host's latest values in the fields the reader left alone, and closes when the
 * event leaves the events or stops being editable. Focus then returns to the event's button, else to
 * the focused day.
 */
export function useEventEditing(options: EventEditingOptions) {
  const { events, timeZone, onEventChange, eventMenu, onEventMenuAction, isEditable } = options;
  const { eventMenuIcons } = options;
  const [editing, setEditing] = useState<{ id: Key; draft: EventDraft } | null>(null);
  const { register, find } = useEventButtons();
  const menu = useMemo<CalendarEventMenuContext>(
    () => ({
      entries: eventMenu,
      onAction: onEventMenuAction,
      icons: eventMenuIcons,
      isEditable,
      edit: (event) => setEditing({ id: event.id, draft: {} }),
    }),
    [eventMenu, onEventMenuAction, eventMenuIcons, isEditable],
  );
  const identity = editing ? toKeyIdentity(editing.id) : null;
  const current = events.find((placed) => toKeyIdentity(placed.event.id) === identity);
  const isOpen = current !== undefined && isEditable(current.event);
  // An editor whose event left, or stopped being editable, closes for good.
  if (editing && !isOpen) setEditing(null);
  // The last event edited stays drawn while the editor closes.
  const [shown, setShown] = useState(current);
  if (current && current !== shown) setShown(current);
  const editor = shown ? (
    <CalendarEventEditor
      placed={shown}
      isOpen={isOpen}
      draft={editing?.draft ?? {}}
      onDraftChange={(draft) => setEditing((open) => (open ? { ...open, draft } : open))}
      timeZone={timeZone}
      onSave={(next, previous) => {
        onEventChange?.(next, previous);
        const day = readEvents([next], timeZone)[0]?.startDay;
        if (day && day !== shown.startDay) options.onMoved(day);
      }}
      onClose={() => setEditing(null)}
      finalFocus={() => find(shown.event.id) ?? options.findDayCell()}
    />
  ) : null;
  return { menu, register, editor };
}
