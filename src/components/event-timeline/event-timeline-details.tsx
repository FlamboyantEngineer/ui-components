'use client';

import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { ProseTable } from '../prose-table/prose-table.js';
import type { EventTimelineEvent } from './event-timeline.js';
import { eventTimelineHooks as hooks } from './event-timeline-hooks.js';
import { readDuration } from './event-timeline-layout.js';

/** The current event's name, start, duration (for an interval) and the caller's details. */
export function EventTimelineDetails({
  event,
  bodyId,
  formatValue,
}: {
  event: EventTimelineEvent;
  bodyId: string;
  formatValue: (value: number) => string;
}) {
  const strings = useUiStrings();
  const duration = readDuration(event);
  return (
    <div {...hooks.slot('details')}>
      <span {...hooks.slot('details-label')}>{event.label}</span>
      <dl {...hooks.slot('details-list')}>
        <dt>{strings.timelineStartColumn}</dt>
        <dd>{formatValue(event.at)}</dd>
        {duration > 0 ? (
          <>
            <dt>{strings.timelineDurationColumn}</dt>
            <dd>{formatValue(duration)}</dd>
          </>
        ) : null}
      </dl>
      {isEmptyNode(event.details) ? null : (
        <div {...hooks.slot('details-body')} id={bodyId}>
          {event.details}
        </div>
      )}
    </div>
  );
}

/**
 * The companion table: every readable event in time order, drawn or not, with its start and its
 * duration written by the same formatter as the drawing. A marker's duration cell is empty.
 */
export function EventTimelineTable({
  events,
  formatValue,
  name,
}: {
  events: readonly EventTimelineEvent[];
  formatValue: (value: number) => string;
  name: { 'aria-label'?: string | undefined; 'aria-labelledby'?: string | undefined };
}) {
  const strings = useUiStrings();
  return (
    <ProseTable
      {...name}
      className={hooks.slotClass('table')}
      header={[
        { key: 'event', content: strings.eventTimelineEventColumn, isRowHeader: true },
        { key: 'start', content: strings.timelineStartColumn, align: 'end' },
        { key: 'duration', content: strings.timelineDurationColumn, align: 'end' },
      ]}
      rows={events.map((event) => {
        const duration = readDuration(event);
        return {
          key: toKeyIdentity(event.id),
          cells: [
            { key: 'event', content: event.label },
            { key: 'start', content: formatValue(event.at) },
            { key: 'duration', content: duration > 0 ? formatValue(duration) : null },
          ],
        };
      })}
    />
  );
}
