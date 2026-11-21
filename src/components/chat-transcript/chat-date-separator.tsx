'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { parseIsoDate, parseIsoDateTime, toCalendarDate } from '../../primitives/index.js';
import { Marker, MarkerContent } from '../marker/marker.js';
import { RelativeTime, type RelativeTimeProps } from '../relative-time/relative-time.js';

export interface ChatDateSeparatorProps
  extends RefProps<HTMLDivElement>, BaseProps, Pick<RelativeTimeProps, 'getNow'> {
  /**
   * The day the messages after it were written: an ISO 8601 date (`YYYY-MM-DD`), or a date and
   * time, read as the reader's local day.
   */
  date: string;
}

const hooks = createHooks('chat-date-separator', ['label']);

/** The local calendar day of a date or a date and time, as `YYYY-MM-DD`; `null` when unreadable. */
function toLocalDay(value: string): string | null {
  if (parseIsoDate(value)) return value;
  const dateTime = parseIsoDateTime(value);
  return dateTime ? toCalendarDate(dateTime).toString() : null;
}

/**
 * A separator `Marker` that marks the day the following messages were written: `Today`, `Yesterday`, or the full date in
 * the reader's locale. It has no role, so it may sit between the articles of a feed, and its words
 * move on at midnight like any `RelativeTime`.
 */
export function ChatDateSeparator({ date, getNow, className, ...rest }: ChatDateSeparatorProps) {
  const day = toLocalDay(date);
  if (!day) return null;
  return (
    <Marker {...rest} {...hooks.root({ className, props: rest })} variant="separator">
      <MarkerContent>
        <RelativeTime
          value={day}
          getNow={getNow}
          fallbackAfterDays={2}
          dateStyle="full"
          showTooltip={false}
          className={hooks.slotClass('label')}
        />
      </MarkerContent>
    </Marker>
  );
}
