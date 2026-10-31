'use client';

// Announces the notifications that arrive while a list is shown, in a polite live region.

import { useState } from 'react';
import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden, type VisuallyHiddenElement } from '../visually-hidden/visually-hidden.js';

interface Arrivals {
  /** Every key shown so far. */
  seen: ReadonlySet<Key>;
  /** The latest time shown so far, in milliseconds; older entries are pages loaded later. */
  latest: number;
  message: string;
}

interface ArrivalEntry {
  id: Key;
  title: string;
  time: string;
  isRead?: boolean | undefined;
}

function latestTime(items: readonly ArrivalEntry[], since: number): number {
  return items.reduce((latest, item) => {
    const time = Date.parse(item.time);
    return Number.isNaN(time) ? latest : Math.max(latest, time);
  }, since);
}

/**
 * The announcement of the unread entries that appeared since the last render and are newer than
 * every entry shown before: one by its title, several by their count. Entries present at first,
 * the first page of a list that started empty, older pages loaded later and entries already read
 * are never announced.
 */
function useArrivalAnnouncement(items: readonly ArrivalEntry[]): string {
  const strings = useUiStrings();
  const [arrivals, setArrivals] = useState<Arrivals>(() => ({
    seen: new Set(items.map((item) => item.id)),
    latest: latestTime(items, -Infinity),
    message: '',
  }));
  const unseen = items.filter((item) => !arrivals.seen.has(item.id));
  if (unseen.length > 0) {
    // The first entries a list that started empty receives are its first page, not arrivals.
    const fresh =
      arrivals.seen.size === 0
        ? []
        : unseen.filter((item) => !item.isRead && Date.parse(item.time) > arrivals.latest);
    // Adjusting state while rendering keeps the announcement in step with the items it words.
    setArrivals({
      seen: new Set([...arrivals.seen, ...unseen.map((item) => item.id)]),
      latest: latestTime(unseen, arrivals.latest),
      message: fresh[0] ? strings.newNotifications(fresh.length, fresh[0].title) : arrivals.message,
    });
  }
  return arrivals.message;
}

interface ArrivalAnnouncementProps {
  items: readonly ArrivalEntry[];
  /** The status's hook class. */
  className: string;
  elementType?: VisuallyHiddenElement | undefined;
}

/** The visually hidden polite status that announces the arrivals among `items`. */
export function ArrivalAnnouncement({ items, className, elementType }: ArrivalAnnouncementProps) {
  const announcement = useArrivalAnnouncement(items);
  return (
    <VisuallyHidden elementType={elementType} role="status" className={className}>
      {announcement}
    </VisuallyHidden>
  );
}
