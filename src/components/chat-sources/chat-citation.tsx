'use client';

import { type Ref, useState } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { HoverCard, HoverCardTrigger } from '../hover-card/hover-card.js';
import { Link } from '../link/link.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';
import { type ChatSource, ChatSourceSummary, isExternalUrl } from './chat-source-summary.js';

/** The data of a citation, as a message part carries it. */
export interface ChatCitationData {
  /** The cited source. */
  source: ChatSource;
  /** The marker's number, counted from 1: the source's place in the answer's sources. */
  index: number;
}

export interface ChatCitationProps
  extends RefProps<HTMLAnchorElement | HTMLButtonElement>, BaseProps, ChatCitationData {}

const hooks = createHooks('chat-citation', ['marker', 'card', 'title', 'site', 'snippet']);

/**
 * An inline numbered marker (`[1]`) for a source. It links to the source and previews it in a
 * `HoverCard` on hover, keyboard focus and long press; a source without a URL opens its card on
 * press instead.
 */
export function ChatCitation({ ref, source, index, className, id, ...rest }: ChatCitationProps) {
  const strings = useUiStrings();
  const [isOpen, setOpen] = useState(false);
  const rootProps = { ...hooks.root({ className, props: rest }), id };
  const content = (
    <>
      <span {...hooks.slot('marker')} aria-hidden="true">
        {`[${index}]`}
      </span>
      <VisuallyHidden as="span">{strings.chatCitationLabel(index, source.title)}</VisuallyHidden>
    </>
  );
  return (
    <HoverCardTrigger isOpen={isOpen} onOpenChange={setOpen}>
      {source.url ? (
        <Link
          {...rootProps}
          // The root is this link or the button below, each typed as its own element.
          ref={ref as Ref<HTMLAnchorElement> | undefined}
          href={source.url}
          isExternal={isExternalUrl(source.url)}
          underline="hover"
        >
          {content}
        </Link>
      ) : (
        <Button
          {...rootProps}
          ref={ref}
          variant="bare"
          content="parts"
          onPress={() => setOpen(true)}
        >
          {content}
        </Button>
      )}
      <HoverCard className={hooks.slotClass('card')} aria-label={source.title}>
        <ChatSourceSummary source={source} slotClass={hooks.slotClass} />
      </HoverCard>
    </HoverCardTrigger>
  );
}
