'use client';

// What is happening after a thread's replies: a reply being posted, someone typing, a reply that
// failed, each with optional Cancel and Retry (specs/COMMENT-THREAD.md, UIC-COMMENT-THREAD-1.12).

import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { Spinner } from '../progress-bar/progress-bar.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { commentThreadHooks as hooks } from './comment-thread-hooks.js';

/** What an activity row says is happening. */
export type CommentThreadActivityKind = 'pending' | 'typing' | 'error';

/** One row after the replies, such as "Posting your reply…" or "Ana is typing…". */
export interface CommentThreadActivity {
  /** Identifies the row across renders. */
  key: Key;
  kind: CommentThreadActivityKind;
  /** What the row says, which is also announced politely. */
  label: string;
  /** Offers Cancel, such as for a reply still being posted. */
  onCancel?: (() => void) | undefined;
  /** Offers Retry, such as for a reply that failed. */
  onRetry?: (() => void) | undefined;
}

function ActivityRow({ entry }: { entry: CommentThreadActivity }) {
  const strings = useUiStrings();
  return (
    <li {...hooks.slot('activity-item', { kind: entry.kind })}>
      {entry.kind === 'error' ? null : <Spinner size="sm" />}
      <span {...hooks.slot('activity-label')}>{entry.label}</span>
      {entry.onCancel ? (
        <Button
          variant="ghost"
          size="xs"
          className={hooks.slotClass('activity-cancel')}
          onPress={entry.onCancel}
        >
          {strings.cancel}
        </Button>
      ) : null}
      {entry.onRetry ? (
        <Button
          variant="ghost"
          size="xs"
          className={hooks.slotClass('activity-retry')}
          onPress={entry.onRetry}
        >
          {strings.retry}
        </Button>
      ) : null}
    </li>
  );
}

/**
 * The activity rows after the replies, and a polite live region, rendered whenever the thread takes
 * activity (even none yet), that reads their labels so a change is announced without moving focus.
 */
export function CommentThreadActivityList({
  activity,
}: {
  activity: readonly CommentThreadActivity[] | undefined;
}) {
  if (activity === undefined) return null;
  return (
    <>
      {activity.length === 0 ? null : (
        <ul {...hooks.slot('activity')}>
          {activity.map((entry) => (
            <ActivityRow key={entry.key} entry={entry} />
          ))}
        </ul>
      )}
      <VisuallyHidden as="span" className={hooks.slotClass('activity-status')} role="status">
        {activity.map((entry) => entry.label).join(' ')}
      </VisuallyHidden>
    </>
  );
}
