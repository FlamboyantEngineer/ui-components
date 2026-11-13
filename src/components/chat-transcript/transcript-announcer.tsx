'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { UiStrings } from '../../core/strings.js';
import { REANNOUNCE_MARK } from '../../utils/reannounce.js';
import { useLatest } from '../../utils/use-latest.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { transcriptHooks as hooks } from './transcript-hooks.js';

/** A message to announce: its author's name (`null` for a notice) and its text. */
interface MessageAnnouncement {
  author: string | null;
  text: string;
}

/** The transcript's announcer: what its live region reads, and how to queue more. */
export interface TranscriptAnnouncer {
  text: string;
  /** Queues a new message; several within a second are announced as a count. */
  message(announcement: MessageAnnouncement): void;
  /** Queues a status, such as older messages loading. */
  notice(text: string): void;
}

/** Announcements are spaced at least this far apart, in milliseconds. */
const announceInterval = 1000;

/** One announcement for everything queued: the statuses, then the message or the count of them. */
function composeAnnouncement(
  messages: readonly MessageAnnouncement[],
  notices: readonly string[],
  strings: UiStrings,
): string {
  const [first] = messages;
  const parts = [...notices];
  if (messages.length > 1) parts.push(strings.newMessageCount(messages.length));
  else if (first) parts.push(strings.newMessageAnnouncement(first.author, first.text));
  return parts.join(' ');
}

/**
 * Queues announcements and reads them out through one polite live region at most once a
 * second: the first right away, then what arrived meanwhile as one announcement.
 */
export function useTranscriptAnnouncer(strings: UiStrings): TranscriptAnnouncer {
  const [text, setText] = useState('');
  const queue = useRef({ messages: [] as MessageAnnouncement[], notices: [] as string[] });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stringsRef = useLatest(strings);

  const pump = useCallback(() => {
    const announce = () => {
      if (timer.current !== null) return;
      const { messages, notices } = queue.current;
      if (messages.length === 0 && notices.length === 0) return;
      const next = composeAnnouncement(messages, notices, stringsRef.current);
      queue.current = { messages: [], notices: [] };
      // A repeated announcement still changes the region, so it is read again.
      setText((current) => (current === next ? `${next}${REANNOUNCE_MARK}` : next));
      timer.current = setTimeout(() => {
        timer.current = null;
        announce();
      }, announceInterval);
    };
    announce();
  }, [stringsRef]);

  // The effects of a kept tree stop and start again when an `Activity` hides and shows it: a
  // stopped timer is forgotten too, or it would hold every later announcement back for good.
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
    },
    [],
  );

  return {
    text,
    message(announcement) {
      queue.current.messages.push(announcement);
      pump();
    },
    notice(notice) {
      queue.current.notices.push(notice);
      pump();
    },
  };
}

/** The visually hidden live region the announcer reads through. */
export function TranscriptAnnouncerRegion({ text }: { text: string }) {
  return (
    <VisuallyHidden className={hooks.slotClass('announcer')} role="status">
      {text}
    </VisuallyHidden>
  );
}
