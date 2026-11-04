'use client';

import { type CSSProperties, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton } from '../../primitives/index.js';
import { isFocused } from '../../utils/focus-target.js';
import { mergeRefs } from '../../utils/merge-props.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import {
  type CalendarEventHandlesContext,
  EventEdge,
  type EventPlacement,
  readGestures,
  useEventDrag,
  useRefocus,
} from './calendar-event-handles.js';
import { type CalendarEventMenuContext, useEventMenu } from './calendar-event-menu.js';
import type { PlacedEvent, WeekSegment } from './calendar-layout.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import type { CalendarFormat } from './use-calendar-format.js';
import { dayCellSelector } from './use-calendar-grid.js';

/** What every event of a calendar view needs. */
export interface CalendarEventContext {
  format: CalendarFormat;
  onEventAction: ((key: Key) => void) | undefined;
  /** The event menus' entries and actions. */
  menu: CalendarEventMenuContext;
  /** Records an event's button while it is on show, until the returned cleanup runs. */
  register: (id: Key, element: HTMLElement) => () => void;
  /** The move and resize handles' contract with the calendar. */
  handles: CalendarEventHandlesContext;
}

interface CalendarEventButtonProps {
  placed: PlacedEvent;
  context: CalendarEventContext;
  /** Whether the event is in the Tab sequence: only the focused day's events are. */
  isTabbable: boolean;
  /** The time shown before the title: the start, the range, or none. */
  time: 'start' | 'range' | 'none';
  /** Where it is drawn: a bar across days, a block on a time grid, or in a crowded day's list. */
  placement: EventPlacement | 'list';
  continuesBefore?: boolean | undefined;
  continuesAfter?: boolean | undefined;
  /** Its geometry: a bar's width across days, or a timed block's place in its day. */
  style?: CSSProperties | undefined;
}

interface CalendarEventLanesProps {
  /** The bars that may start in this day's column. */
  segments: readonly WeekSegment[];
  /** The previews of dragged bars that may start in this day's column, drawn over its first lane. */
  previews: readonly WeekSegment[];
  column: number;
  laneCount: number;
  context: CalendarEventContext;
  isTabbable: boolean;
  time: CalendarEventButtonProps['time'];
}

interface CalendarMoreEventsProps {
  /** The day's events, all of them. */
  events: readonly PlacedEvent[];
  /** How many of them the cell hides. */
  hidden: number;
  /** The day in full, which titles the list. */
  dayLabel: string;
  isTabbable: boolean;
  context: CalendarEventContext;
}

function formatTime(
  placed: PlacedEvent,
  time: CalendarEventButtonProps['time'],
  format: CalendarFormat,
) {
  if (time === 'none' || placed.isAllDay) return null;
  return time === 'start' ? format.formatTime(placed.start) : format.formatWhen(placed);
}

/**
 * A focused event button that leaves the view (removed, or hidden behind a crowded day's more
 * button) hands focus to its day cell rather than dropping it on the page.
 */
function useFocusHandoff() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    // The button and its tree, read before the button leaves it.
    const button = ref.current;
    const root = button?.getRootNode();
    return () => {
      if (button && isFocused(button, root)) {
        button.closest<HTMLElement>(dayCellSelector)?.focus();
      }
    };
  }, []);
  return ref;
}

/** The button's ref: the focus handoff, the calendar's record of it, and its context menu target. */
function useEventButtonRef(id: Key, register: CalendarEventContext['register']) {
  const handoff = useFocusHandoff();
  const record = useCallback(
    (element: HTMLElement | null) => (element ? register(id, element) : undefined),
    [register, id],
  );
  const ref = useMemo(() => mergeRefs(handoff, record), [handoff, record]);
  return { ref, element: handoff };
}

/** A rendered event's key: its id's, apart from the preview of the same event being dragged. */
export function toEventKey(placed: PlacedEvent): string {
  const identity = toKeyIdentity(placed.event.id);
  return placed.isPreview ? `preview:${identity}` : identity;
}

/** The time and title an event shows, hidden from assistive technology behind its name. */
function EventText({
  placed,
  time,
  context,
}: Pick<CalendarEventButtonProps, 'placed' | 'time' | 'context'>) {
  const shown = formatTime(placed, time, context.format);
  return (
    <>
      {shown ? (
        <span aria-hidden="true" {...hooks.slot('event-time')}>
          {shown}
        </span>
      ) : null}
      <span aria-hidden="true" {...hooks.slot('event-title')}>
        {placed.event.title}
      </span>
    </>
  );
}

function readData(placed: PlacedEvent, continuesBefore: boolean, continuesAfter: boolean) {
  return {
    allDay: placed.isAllDay,
    tone: placed.event.tone ?? 'neutral',
    continuesBefore,
    continuesAfter,
  };
}

/**
 * One event: a button showing its title, after its time when asked, and named by its title and when
 * it happens; a press calls `onEventAction` with its key and, when the event is editable, opens
 * the event editor; a context menu request opens the
 * event's menu. A movable event drags to move; an event with start or end edges sits in a frame
 * with them; the preview of a dragged event is drawn without a button.
 */
export function CalendarEventButton(props: CalendarEventButtonProps) {
  const { placed, time, context, style } = props;
  const before = props.continuesBefore ?? false;
  const after = props.continuesAfter ?? false;
  if (!placed.isPreview) return <EventButton {...props} />;
  return (
    <div
      aria-hidden="true"
      {...hooks.slot('event', { ...readData(placed, before, after), preview: true })}
      style={style}
    >
      <EventText placed={placed} time={time} context={context} />
    </div>
  );
}

function EventButton({
  placed,
  context,
  isTabbable,
  time,
  placement,
  continuesBefore = false,
  continuesAfter = false,
  style,
}: CalendarEventButtonProps) {
  const strings = useUiStrings();
  const { event } = placed;
  const { ref, element } = useEventButtonRef(event.id, context.register);
  const eventMenu = useEventMenu(event, context.menu, ref);
  const where = { placement, continuesBefore, continuesAfter };
  const gestures = readGestures(placed, where, context.handles);
  const drag = useEventDrag({
    placed,
    gesture: 'move',
    placement: placement === 'list' ? 'bar' : placement,
    context: context.handles,
    isDisabled: !gestures.move,
    ownerRef: element,
  });
  useRefocus(element, context.handles, { id: event.id, gesture: 'move' });
  const edge = (side: 'start' | 'end') =>
    gestures.edges.includes(side) && placement !== 'list' ? (
      <EventEdge
        placed={placed}
        edge={side}
        placement={placement}
        context={context.handles}
        isTabbable={isTabbable}
      />
    ) : null;
  const hasEdges = gestures.edges.length > 0;
  // Every part of the event shows that it is being dragged, by its body or by either edge.
  const isDragged = context.handles.dragged === toKeyIdentity(event.id);
  const data = readData(placed, continuesBefore, continuesAfter);
  const button = (
    <AriaButton
      {...eventMenu.targetProps}
      {...drag.pointer}
      {...hooks.slot('event', { ...data, movable: gestures.move, dragging: isDragged })}
      excludeFromTabOrder={!isTabbable}
      style={hasEdges ? undefined : style}
      onKeyDown={(key) => {
        eventMenu.targetProps.onKeyDown(key);
        drag.onKey(key);
      }}
      onPress={() => {
        // The release of a drag is not a click.
        if (drag.consumeClick()) return;
        context.onEventAction?.(event.id);
        if (context.menu.isEditable(event)) context.menu.edit(event);
      }}
    >
      <EventText placed={placed} time={time} context={context} />
      <VisuallyHidden as="span">
        {strings.calendarEvent(event.title, context.format.formatWhen(placed))}
      </VisuallyHidden>
    </AriaButton>
  );
  return (
    <>
      {hasEdges ? (
        <div {...hooks.slot('event-frame', { allDay: placed.isAllDay })} style={style}>
          {edge('start')}
          {button}
          {edge('end')}
        </div>
      ) : (
        button
      )}
      {eventMenu.menu}
    </>
  );
}

/** The `+3 more` button of a crowded day, opening a popover that lists all of the day's events. */
export function CalendarMoreEvents({
  events,
  hidden,
  dayLabel,
  isTabbable,
  context,
}: CalendarMoreEventsProps) {
  const strings = useUiStrings();
  return (
    <PopoverTrigger>
      <Button
        variant="ghost"
        size="xs"
        excludeFromTabOrder={!isTabbable}
        className={hooks.slotClass('more')}
      >
        {strings.moreEvents(hidden)}
      </Button>
      <Popover title={dayLabel} showCloseButton>
        <div {...hooks.slot('more-list')}>
          {events.map((placed) => (
            <CalendarEventButton
              key={toKeyIdentity(placed.event.id)}
              placed={placed}
              context={context}
              isTabbable
              time="start"
              placement="list"
            />
          ))}
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

/**
 * A day's bars, lane by lane: the bar that starts in its column, else a spacer where a bar from an
 * earlier day passes or the lane is empty, so the lanes line up across the week. The preview of a
 * dragged bar that starts in the column is drawn over the first lane, taking none, so no bar moves
 * while it does.
 */
export function CalendarEventLanes({
  segments,
  previews,
  column,
  laneCount,
  context,
  isTabbable,
  time,
}: CalendarEventLanesProps) {
  const overlays = previews
    .filter((segment) => segment.column === column)
    .map((segment) => (
      <CalendarEventButton
        key={toEventKey(segment.placed)}
        placed={segment.placed}
        context={context}
        isTabbable={false}
        time={time}
        placement="bar"
        continuesBefore={segment.continuesBefore}
        continuesAfter={segment.continuesAfter}
        style={{
          position: 'absolute',
          insetBlockStart: 0,
          insetInlineStart: 0,
          width: `${segment.span * 100}%`,
        }}
      />
    ));
  const lanes = Array.from({ length: laneCount }, (_, lane) => {
    const segment = segments.find((entry) => entry.lane === lane && entry.column === column);
    // Spacers are keyed by lane and bars by event, so a repacked lane never hands an event's
    // button, and the focus on it, to another event.
    if (!segment)
      return <div key={`spacer:${lane}`} aria-hidden="true" {...hooks.slot('spacer')} />;
    return (
      <CalendarEventButton
        key={toEventKey(segment.placed)}
        placed={segment.placed}
        context={context}
        isTabbable={isTabbable}
        time={time}
        placement="bar"
        continuesBefore={segment.continuesBefore}
        continuesAfter={segment.continuesAfter}
        style={{ width: `${segment.span * 100}%` }}
      />
    );
  });
  return [...lanes, ...overlays];
}
