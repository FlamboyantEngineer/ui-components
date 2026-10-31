'use client';

import type { ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { ActivityAnnouncer } from './activity-announcer.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';

/** The assistant is `thinking` (or acting), or `writing` its answer. */
export type ChatStatusLineActivity = 'thinking' | 'writing';

export interface ChatStatusLineProps extends BaseProps {
  /** What the assistant is doing now, such as "Searching trains…". Defaults to "Thinking…". */
  text?: string | undefined;
  /** A decorative icon in place of the busy indicator. */
  icon?: ReactNode;
  /** `writing` shows the indicator alone, without text or announcement. Defaults to `thinking`. */
  activity?: ChatStatusLineActivity | undefined;
  /** The assistant is working; without it the line is gone. Defaults to `true`. */
  isRunning?: boolean | undefined;
}

const hooks = createHooks('chat-status-line', ['spinner', 'icon', 'text']);

/**
 * One line saying what an assistant is doing while it works ("Thinking…" unless told otherwise),
 * with a decorative busy indicator or the caller's icon; while it writes, the indicator alone. Its
 * text is announced politely as it changes, at most once every two seconds; the visible text stays
 * out of the accessibility tree so the reader hears it once. The line is gone once the work ends.
 */
export function ChatStatusLine({
  text,
  icon,
  activity = 'thinking',
  isRunning = true,
  className,
  ...rest
}: ChatStatusLineProps) {
  const strings = useUiStrings();
  if (!isRunning) return null;
  const label = activity === 'writing' ? '' : text || strings.chatThinking;
  return (
    <div {...rest} {...hooks.root({ className, props: rest, data: { activity } })}>
      {isEmptyNode(icon) ? (
        <span {...hooks.slot('spinner')} aria-hidden="true" />
      ) : (
        <span {...hooks.slot('icon')} aria-hidden="true">
          {icon}
        </span>
      )}
      {label ? (
        <span {...hooks.slot('text')} aria-hidden="true">
          {label}
        </span>
      ) : null}
      <ActivityAnnouncer message={label} />
    </div>
  );
}
