'use client';

import { type ReactNode, useId } from 'react';
import { useControllableState } from '../../core/controllable-state.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { measuredProperty } from '../../core/hooks.js';
import type { BaseProps, Key, RefProps, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useLocale, useNumberFormatter } from '../../primitives/index.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { EventTimelineDetails, EventTimelineTable } from './event-timeline-details.js';
import { eventTimelineHooks as hooks } from './event-timeline-hooks.js';
import { type EventTimelineRange, layoutEventTimeline } from './event-timeline-layout.js';
import { EventTimelineAxis, EventTimelinePlot } from './event-timeline-plot.js';

export type { EventTimelineRange } from './event-timeline-layout.js';

/** One read-only event: a marker at an elapsed time, or a short interval from it. */
export interface EventTimelineEvent {
  /** Identifies the event among its siblings; numeric and text ids of one spelling stay apart. */
  id: Key;
  /** Names the event on the axis, in its details and in the table. */
  label: string;
  /** Where the event starts on the elapsed-time axis, in the caller's unit. */
  at: number;
  /** How long the event lasts, in the same unit. A finite, positive value makes an interval. */
  duration?: number | undefined;
  /** What the event stands for. Defaults to `neutral`. */
  tone?: Tone | undefined;
  /** More about the event, shown in the details while it is the current event. */
  details?: ReactNode;
}

export interface EventTimelineProps
  extends BaseProps, AriaLabellingProps, RefProps<HTMLDivElement> {
  /** The events, in any order; the axis and the table show them in time order. */
  events: readonly EventTimelineEvent[];
  /** Visible label. Without one, name the timeline with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The elapsed times the axis spans. Defaults to the events' first start to last end, widened to round values. */
  range?: EventTimelineRange | undefined;
  /** The unit's symbol, shown after the axis and after each value the default formatter writes. */
  unit?: string | undefined;
  /** Writes a start or a duration, in the drawing's descriptions, the details and the table. */
  formatValue?: ((value: number) => string) | undefined;
  /** Writes an axis tick's value. Defaults to the locale's number with the tick step's decimals. */
  formatAxisValue?: ((value: number) => string) | undefined;
  /** The event whose details show (controlled). */
  currentKey?: Key | null | undefined;
  /** The event whose details show first (uncontrolled). Defaults to none. */
  defaultCurrentKey?: Key | null | undefined;
  /** Called with the event a reader focuses or presses. */
  onCurrentKeyChange?: ((key: Key) => void) | undefined;
  /**
   * The share of the axis, from 0 to 1, each event keeps free after it ends before another event
   * may share its lane, so labels drawn after events have room. Defaults to 0.15.
   */
  eventSpacing?: number | undefined;
  /** Show the companion table of every event's start and duration. Defaults to `false`. */
  showTable?: boolean | undefined;
}

/** The share of the axis an event keeps free after it by default. */
const defaultEventSpacing = 0.15;

/** Up to 15 significant digits: every digit a caller's value carries, without binary rounding noise. */
const valueFormat: Intl.NumberFormatOptions = { maximumSignificantDigits: 15 };

/** The caller's formatter, or the locale's number followed by the unit. */
function useFormatValue(
  unit: string | undefined,
  formatValue: ((value: number) => string) | undefined,
): (value: number) => string {
  const number = useNumberFormatter(valueFormat);
  if (formatValue) return formatValue;
  return (value) => (unit ? `${number.format(value)}\u00a0${unit}` : number.format(value));
}

/** The event a key names, compared by identity so numeric and text ids stay apart. */
function findEvent(events: readonly EventTimelineEvent[], key: Key | null) {
  if (key === null) return undefined;
  const identity = toKeyIdentity(key);
  return events.find((event) => toKeyIdentity(event.id) === identity);
}

/** The id that names the group: the caller's naming wins over the visible label. */
function readLabelledBy({
  label,
  labelId,
  props,
}: {
  label: ReactNode;
  labelId: string;
  props: AriaLabellingProps;
}): string | undefined {
  const hasLabel =
    !isEmptyNode(label) && props['aria-labelledby'] === undefined && !props['aria-label'];
  return hasLabel ? labelId : props['aria-labelledby'];
}

/**
 * Read-only events and short intervals on a numeric elapsed-time axis, in the caller's unit: each
 * event is a focusable button that shows its details, coincident and overlapping events take
 * separate lanes, and a companion table lists the same values.
 */
export function EventTimeline({
  events,
  label,
  range,
  unit,
  formatValue: givenFormat,
  formatAxisValue,
  currentKey: givenKey,
  defaultCurrentKey = null,
  onCurrentKeyChange,
  showTable = false,
  eventSpacing = defaultEventSpacing,
  className,
  ...rest
}: EventTimelineProps) {
  const labelId = useId();
  const detailsBodyId = useId();
  const strings = useUiStrings();
  const { locale } = useLocale();
  const formatValue = useFormatValue(unit, givenFormat);
  const [currentKey, setCurrentKey] = useControllableState<Key | null>(
    givenKey,
    defaultCurrentKey,
    (key) => {
      if (key !== null) onCurrentKeyChange?.(key);
    },
  );
  const layout = layoutEventTimeline(events, {
    range,
    locale,
    spacing: eventSpacing,
  });
  const current = findEvent(layout.events, currentKey);
  const labelledBy = readLabelledBy({ label, labelId, props: rest });
  const isEmpty = layout.placed.length === 0;
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { empty: isEmpty } })}
      role="group"
      aria-labelledby={labelledBy}
      style={measuredProperty('event-timeline-lanes', String(layout.lanes))}
    >
      {isEmptyNode(label) ? null : (
        <span {...hooks.slot('label')} id={labelId}>
          {label}
        </span>
      )}
      {isEmpty ? (
        <p {...hooks.slot('empty')}>{strings.noData}</p>
      ) : (
        <EventTimelinePlot
          layout={layout}
          currentKey={currentKey}
          onCurrentKeyChange={setCurrentKey}
          detailsBodyId={current && !isEmptyNode(current.details) ? detailsBodyId : undefined}
          formatValue={formatValue}
        />
      )}
      <EventTimelineAxis layout={layout} unit={unit} formatAxisValue={formatAxisValue} />
      {current ? (
        <EventTimelineDetails event={current} bodyId={detailsBodyId} formatValue={formatValue} />
      ) : null}
      {showTable && layout.events.length > 0 ? (
        <EventTimelineTable
          events={layout.events}
          formatValue={formatValue}
          name={
            labelledBy ? { 'aria-labelledby': labelledBy } : { 'aria-label': rest['aria-label'] }
          }
        />
      ) : null}
    </div>
  );
}
