'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Markdown } from '../markdown/markdown.js';
import { ActivityDisclosure, type ActivityExpansionProps } from './activity-disclosure.js';
import {
  toWholeSeconds,
  type ChatReasoningData,
  type ChatReasoningFormat,
} from './chat-activity.js';

export interface ChatReasoningProps
  extends
    RefProps<HTMLDivElement>,
    Omit<BaseProps, 'id'>,
    ChatReasoningData,
    ActivityExpansionProps {
  /** How the text renders. Defaults to `markdown`. */
  format?: ChatReasoningFormat | undefined;
}

const hooks = createHooks('chat-reasoning', [
  'trigger',
  'indicator',
  'label',
  'spinner',
  'panel',
  'text',
]);

/**
 * An assistant's reasoning as a disclosure. While it streams it is open (unless it does not expand
 * automatically), labelled by its `title` or "Thinking…" and busy, with the text coming in; once
 * complete it collapses, labelled with how long it took. The reader's own choice wins over both.
 */
export function ChatReasoning({
  text,
  title,
  status,
  durationMs,
  format = 'markdown',
  className,
  ...rest
}: ChatReasoningProps) {
  const strings = useUiStrings();
  const isStreaming = status === 'streaming';
  const label = isStreaming
    ? title || strings.chatReasoningStreaming
    : strings.chatReasoningComplete(toWholeSeconds(durationMs));
  return (
    <ActivityDisclosure
      {...rest}
      className={className}
      hooks={hooks}
      isActive={isStreaming}
      isPanelBusy={isStreaming}
      label={label}
      data={{ status, format }}
    >
      {format === 'markdown' ? (
        <Markdown source={text} isStreaming={isStreaming} className={hooks.slotClass('text')} />
      ) : (
        <div {...hooks.slot('text')}>{text}</div>
      )}
    </ActivityDisclosure>
  );
}
