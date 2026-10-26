import type { CSSProperties } from 'react';
import { Button as AriaButton } from '../../primitives/index.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Popover, PopoverTrigger } from '../popover/popover.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { PlacedEvent, WeekSegment } from './calendar-layout.js';
import { calendarViewHooks as hooks } from './calendar-view-hooks.js';
import type { CalendarFormat } from './use-calendar-format.js';

/** What every event of a calendar view needs. */
export interface CalendarEventContext {
  format: CalendarFormat;
  onEventAction: ((key: Key) => void) | undefined;
}

export interface CalendarEventButtonProps {
  placed: PlacedEvent;
  context: CalendarEventContext;
  /** Whether the event is in the Tab sequence: only the focused day's events are. */
  isTabbable: boolean;
  /** The time shown before the title: the start, the range, or none. */
  time: 'start' | 'range' | 'none';
  continuesBefore?: boolean | undefined;
  continuesAfter?: boolean | undefined;
  /** Its geometry: a bar's width across days, or a timed block's place in its day. */
  style?: CSSProperties | undefined;
}

export interface CalendarEventLanesProps {
  /** The bars that may start in this day's column. */
  segments: readonly WeekSegment[];
  column: number;
  laneCount: number;
  context: CalendarEventContext;
  isTabbable: boolean;
  time: CalendarEventButtonProps['time'];
}

export interface CalendarMoreEventsProps {
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
 * One event: a button showing its title, after its time when asked, and named by its title and when
 * it happens; a press calls `onEventAction` with its key.
 */
export function CalendarEventButton({
  placed,
  context,
  isTabbable,
  time,
  continuesBefore = false,
  continuesAfter = false,
  style,
}: CalendarEventButtonProps) {
  const strings = useUiStrings();
  const { event } = placed;
  const shown = formatTime(placed, time, context.format);
  const data = {
    allDay: placed.isAllDay,
    tone: event.tone ?? 'neutral',
    continuesBefore,
    continuesAfter,
  };
  return (
    <AriaButton
      {...hooks.slot('event', data)}
      excludeFromTabOrder={!isTabbable}
      style={style}
      onPress={() => context.onEventAction?.(event.id)}
    >
      {shown ? (
        <span aria-hidden="true" {...hooks.slot('event-time')}>
          {shown}
        </span>
      ) : null}
      <span aria-hidden="true" {...hooks.slot('event-title')}>
        {event.title}
      </span>
      <VisuallyHidden elementType="span">
        {strings.calendarEvent(event.title, context.format.formatWhen(placed))}
      </VisuallyHidden>
    </AriaButton>
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
            />
          ))}
        </div>
      </Popover>
    </PopoverTrigger>
  );
}

/**
 * A day's bars, lane by lane: the bar that starts in its column, else a spacer where a bar from an
 * earlier day passes or the lane is empty, so the lanes line up across the week.
 */
export function CalendarEventLanes({
  segments,
  column,
  laneCount,
  context,
  isTabbable,
  time,
}: CalendarEventLanesProps) {
  return Array.from({ length: laneCount }, (_, lane) => {
    const segment = segments.find((entry) => entry.lane === lane && entry.column === column);
    if (!segment) return <div key={lane} aria-hidden="true" {...hooks.slot('spacer')} />;
    return (
      <CalendarEventButton
        key={lane}
        placed={segment.placed}
        context={context}
        isTabbable={isTabbable}
        time={time}
        continuesBefore={segment.continuesBefore}
        continuesAfter={segment.continuesAfter}
        style={{ width: `${segment.span * 100}%` }}
      />
    );
  });
}
