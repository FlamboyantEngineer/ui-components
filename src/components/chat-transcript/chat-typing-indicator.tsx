'use client';

import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { getDisplayName } from '../avatar/avatar.js';

export interface ChatTypingIndicatorProps extends BaseProps {
  /** Who is typing, in the order they started. Nobody typing leaves the indicator empty. */
  names?: readonly string[] | undefined;
}

const hooks = createHooks('chat-typing-indicator', ['dots', 'dot', 'text']);

const dotKeys = ['first', 'second', 'third'] as const;

/**
 * Says who is typing (`Ana is typing…`, `Ana and Ben are typing…`, `Ana and 2 others are
 * typing…`) beside three decorative dots a stylesheet animates. It is a polite status: keep it
 * mounted, empty while nobody types, so changes are announced.
 */
export function ChatTypingIndicator({ names = [], className, ...rest }: ChatTypingIndicatorProps) {
  const strings = useUiStrings();
  const displayNames = names.map((name) => getDisplayName(name, strings.unnamed));
  const text = displayNames.length > 0 ? strings.chatTyping(displayNames) : null;
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { empty: text === null } })}
      role="status"
    >
      {text === null ? null : (
        <>
          <span {...hooks.slot('dots')} aria-hidden="true">
            {dotKeys.map((key) => (
              <span key={key} {...hooks.slot('dot')} />
            ))}
          </span>
          <span {...hooks.slot('text')}>{text}</span>
        </>
      )}
    </div>
  );
}
