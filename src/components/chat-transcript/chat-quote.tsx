'use client';

import type { Ref } from 'react';
import type { PressEvent } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button as AriaButton } from '../../primitives/index.js';
import { getDisplayName } from '../avatar/avatar.js';

/** The message a reply quotes. */
export interface ChatQuoteData {
  /** Who wrote the quoted message. */
  authorName: string;
  /** The start of the quoted message, as plain text. */
  excerpt: string;
  /** The quoted message's id, so pressing the quote can jump to it. */
  messageId?: string | undefined;
}

export interface ChatQuoteProps
  extends
    RefProps<HTMLQuoteElement | HTMLButtonElement>,
    Omit<ChatQuoteData, 'messageId'>,
    BaseProps {
  /** Makes the quote a button, such as one that jumps to the quoted message. */
  onPress?: ((event: PressEvent) => void) | undefined;
}

const hooks = createHooks('chat-quote', ['author', 'excerpt']);

/**
 * A quoted message: its author and an excerpt, in a `<blockquote>`, or in a button named after
 * both when `onPress` makes it jump to the original. Used in a reply and in a composer's reply
 * banner.
 */
export function ChatQuote({
  ref,
  authorName,
  excerpt,
  onPress,
  className,
  ...rest
}: ChatQuoteProps) {
  const strings = useUiStrings();
  const name = getDisplayName(authorName, strings.unnamed);
  const rootProps = { ...rest, ...hooks.root({ className, props: rest }) };
  const parts = (
    <>
      <span {...hooks.slot('author')}>{name}</span>{' '}
      <span {...hooks.slot('excerpt')}>{excerpt}</span>
    </>
  );
  // The root is a `<blockquote>` or a button, so each takes the caller's ref as its own element's.
  if (!onPress) {
    return (
      <blockquote {...rootProps} ref={ref as Ref<HTMLQuoteElement> | undefined}>
        {parts}
      </blockquote>
    );
  }
  return (
    <AriaButton
      {...rootProps}
      ref={ref as Ref<HTMLButtonElement> | undefined}
      aria-label={strings.chatQuoteLabel(name, excerpt)}
      onPress={onPress}
    >
      {parts}
    </AriaButton>
  );
}
