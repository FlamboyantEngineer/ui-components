'use client';

import { Fragment, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import {
  type CommentTextSegment,
  type MentionCandidate,
  type MentionKind,
  parseMentions,
} from '../comment-composer/comment-mentions.js';
import { UserCardTrigger } from '../user-card-trigger/user-card-trigger.js';

export interface CommentTextProps extends BaseProps, RefProps<HTMLSpanElement> {
  /** The comment's stored text, with its mentions as tokens. */
  text: string;
  /** Splits the text into text and mentions. Defaults to `parseMentions`, for `@[Name](id)`. */
  parse?: ((text: string) => readonly CommentTextSegment[]) | undefined;
  /**
   * The card a mention's chip opens, usually a `UserCard` for a person; without one the chip is
   * plain text. It receives what the mention names, `kind` included.
   */
  renderCard?:
    | ((person: Pick<MentionCandidate, 'id' | 'name'> & { kind: MentionKind }) => ReactNode)
    | undefined;
}

const hooks = createHooks('comment-text', ['mention']);

/** Each run with its offset in the text, which keys it stably across renders of the same text. */
function toKeyedSegments(segments: readonly CommentTextSegment[]) {
  let at = 0;
  return segments.map((segment) => {
    const key = at;
    at += segment.text.length;
    return { key, segment };
  });
}

/** A mention as a chip named by the person, which opens their card when the host has one. */
function MentionChip({
  segment,
  renderCard,
}: Pick<CommentTextProps, 'renderCard'> & {
  segment: Extract<CommentTextSegment, { kind: 'mention' }>;
}) {
  const kind = segment.mentionKind ?? 'person';
  const card = renderCard?.({ id: segment.id, name: segment.name, kind });
  const chip = <span {...hooks.slot('mention', { kind })}>{segment.name}</span>;
  if (card === undefined || card === null) return chip;
  return <UserCardTrigger card={card}>{chip}</UserCardTrigger>;
}

/**
 * A comment's stored text for reading: its plain text, and each mention as a chip that shows the
 * person's name and, with `renderCard`, opens their card.
 */
export function CommentText({
  text,
  parse = parseMentions,
  renderCard,
  className,
  ...rest
}: CommentTextProps) {
  return (
    <span {...rest} {...hooks.root({ className })}>
      {toKeyedSegments(parse(text)).map(({ key, segment }) =>
        segment.kind === 'mention' ? (
          <MentionChip key={key} segment={segment} renderCard={renderCard} />
        ) : (
          <Fragment key={key}>{segment.text}</Fragment>
        ),
      )}
    </span>
  );
}
