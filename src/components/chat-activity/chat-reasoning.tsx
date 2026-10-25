import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Markdown } from '../markdown/markdown.js';
import { ActivityDisclosure, type ActivityExpansionProps } from './activity-disclosure.js';
import {
  toWholeSeconds,
  type ChatReasoningData,
  type ChatReasoningFormat,
} from './chat-activity.js';

export interface ChatReasoningProps
  extends Omit<BaseProps, 'id'>, ChatReasoningData, ActivityExpansionProps {
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
 * An assistant's reasoning as a disclosure. While it streams it is open, labelled "Thinking…" and
 * busy, with the text coming in; once complete it collapses, labelled with how long it took. The
 * reader's own choice wins over both.
 */
export function ChatReasoning({
  text,
  status,
  durationMs,
  format = 'markdown',
  className,
  ...rest
}: ChatReasoningProps) {
  const strings = useUiStrings();
  const isStreaming = status === 'streaming';
  const label = isStreaming
    ? strings.chatReasoningStreaming
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
        <Markdown source={text} className={hooks.slotClass('text')} />
      ) : (
        <div {...hooks.slot('text')}>{text}</div>
      )}
    </ActivityDisclosure>
  );
}
