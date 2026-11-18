'use client';

import { type KeyboardEvent, useId } from 'react';
import { measuredProperty } from '../../core/hooks.js';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale } from '../../primitives/index.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { EventTimelineEvent } from './event-timeline.js';
import { eventTimelineHooks as hooks } from './event-timeline-hooks.js';
import {
  type EventTimelineLayout,
  type PlacedEvent,
  readDuration,
} from './event-timeline-layout.js';

interface EventTimelinePlotProps {
  layout: EventTimelineLayout<EventTimelineEvent>;
  currentKey: Key | null;
  onCurrentKeyChange: (key: Key) => void;
  /** The id of the current event's caller details, which describe it. */
  detailsBodyId: string | undefined;
  formatValue: (value: number) => string;
}

/** The index a navigation key moves to among `count` events from `index`, or `undefined`. */
function findTarget(
  key: string,
  { index, count, isRtl }: { index: number; count: number; isRtl: boolean },
): number | undefined {
  const previous = isRtl ? 'ArrowRight' : 'ArrowLeft';
  const next = isRtl ? 'ArrowLeft' : 'ArrowRight';
  switch (key) {
    case previous:
      return Math.max(index - 1, 0);
    case next:
      return Math.min(index + 1, count - 1);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
}

/** Moves focus along the drawn events, which the plot holds in time order. */
function onEventKeyDown(event: KeyboardEvent<HTMLButtonElement>, isRtl: boolean) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const buttons = [
    ...(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      `:scope > .${hooks.slotClass('event')}`,
    ) ?? []),
  ];
  const index = buttons.indexOf(event.currentTarget);
  const target = findTarget(event.key, { index, count: buttons.length, isRtl });
  if (target === undefined) return;
  event.preventDefault();
  buttons[target]?.focus();
}

/** The text that describes an event's place in time: its start, and its duration for an interval. */
function useDescribeTime(formatValue: (value: number) => string) {
  const strings = useUiStrings();
  return (event: EventTimelineEvent) => {
    const duration = readDuration(event);
    const at = formatValue(event.at);
    return duration > 0
      ? strings.eventTimelineInterval(at, formatValue(duration))
      : strings.eventTimelineAt(at);
  };
}

/**
 * The drawn events, one button each in time order, with one tab stop: on the current event when it
 * is drawn, otherwise on the first. Focusing or pressing an event makes it the current one.
 */
export function EventTimelinePlot({
  layout,
  currentKey,
  onCurrentKeyChange,
  detailsBodyId,
  formatValue,
}: EventTimelinePlotProps) {
  const descriptionId = useId();
  const isRtl = useLocale().direction === 'rtl';
  const describeTime = useDescribeTime(formatValue);
  const current = currentKey === null ? undefined : toKeyIdentity(currentKey);
  const hasCurrent = layout.placed.some(({ event }) => toKeyIdentity(event.id) === current);
  const renderEvent = (placed: PlacedEvent<EventTimelineEvent>, index: number) => {
    const { event } = placed;
    const identity = toKeyIdentity(event.id);
    const isCurrent = identity === current;
    const isTabStop = hasCurrent ? isCurrent : index === 0;
    const timeId = `${descriptionId}-${placed.order}`;
    return (
      <button
        key={identity}
        type="button"
        {...hooks.slot('event', {
          kind: placed.isInterval ? 'interval' : 'marker',
          tone: event.tone ?? 'neutral',
          current: isCurrent,
          clipped: placed.clip,
        })}
        style={{
          [isRtl ? 'right' : 'left']: `${placed.offset}%`,
          width: placed.isInterval ? `${placed.width}%` : undefined,
          ...measuredProperty('event-lane', String(placed.lane)),
        }}
        tabIndex={isTabStop ? 0 : -1}
        aria-current={isCurrent || undefined}
        aria-describedby={isCurrent && detailsBodyId ? `${timeId} ${detailsBodyId}` : timeId}
        onFocus={() => onCurrentKeyChange(event.id)}
        onClick={() => onCurrentKeyChange(event.id)}
        onKeyDown={(keyEvent) => onEventKeyDown(keyEvent, isRtl)}
      >
        <span {...hooks.slot('event-label')}>{event.label}</span>
      </button>
    );
  };
  return (
    <div {...hooks.slot('plot')}>
      {layout.placed.map(renderEvent)}
      <div hidden>
        {layout.placed.map((placed) => (
          <span key={toKeyIdentity(placed.event.id)} id={`${descriptionId}-${placed.order}`}>
            {describeTime(placed.event)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** The decorative axis: a tick per round value, offset along the range, and the unit after it. */
export function EventTimelineAxis({
  layout,
  unit,
  formatAxisValue,
}: {
  layout: EventTimelineLayout<EventTimelineEvent>;
  unit: string | undefined;
  formatAxisValue: ((value: number) => string) | undefined;
}) {
  const isRtl = useLocale().direction === 'rtl';
  return (
    <div {...hooks.slot('axis')} aria-hidden="true">
      {layout.ticks.map((tick) => (
        <span
          key={tick.value}
          {...hooks.slot('tick')}
          style={{ [isRtl ? 'right' : 'left']: `${tick.offset}%` }}
        >
          <span {...hooks.slot('tick-label')}>
            {formatAxisValue ? formatAxisValue(tick.value) : tick.label}
          </span>
        </span>
      ))}
      {unit ? <span {...hooks.slot('unit')}>{unit}</span> : null}
    </div>
  );
}
