'use client';

// The comment composer's text box with mentions, on the rich composer's editor and its trigger
// completions (specs/COMMENT-COMPOSER.md, UIC-COMMENT-COMPOSER-2).

import { useMemo } from 'react';
import { useUiStrings } from '../../../core/provider.js';
import type { UiStrings } from '../../../core/strings.js';
import { Avatar } from '../../avatar/avatar.js';
import type { MessageComposerMessage } from '../../message-composer/composer-message.js';
import {
  type MessageComposerTrigger,
  RichMessageField,
} from '../../message-composer/rich/rich-message-composer.js';
import type {
  CommentMentionFieldProps,
  CommentMentions,
  CommentTextSegment,
  MentionCandidate,
} from '../comment-mentions.js';

/** The trigger id the mention tokens carry in the editor. */
const mentionTrigger = 'mention';

/**
 * A suggestion for a candidate: its name, picture and second line (with a group's member count),
 * and the token it inserts.
 */
function toSuggestion(candidate: MentionCandidate, mentions: CommentMentions, strings: UiStrings) {
  const count = candidate.count === undefined ? null : strings.mentionGroupCount(candidate.count);
  const description = [candidate.description, count].filter(Boolean).join(' · ');
  return {
    id: candidate.id,
    label: candidate.name,
    text: mentions.serialize(candidate),
    description: description || undefined,
    icon: <Avatar name={candidate.name} src={candidate.avatar} size="xs" decorative />,
  };
}

/** `@` as a trigger whose source is the host's search. */
function toMentionTrigger(mentions: CommentMentions, strings: UiStrings): MessageComposerTrigger {
  return {
    id: mentionTrigger,
    character: '@',
    getCompletions: (query, { signal }) =>
      mentions
        .search(query, signal)
        .then((candidates) =>
          candidates.map((candidate) => toSuggestion(candidate, mentions, strings)),
        ),
  };
}

/** The draft as the editor holds it: its text, with each mention a token over its raw text. */
function toMessage(text: string, segments: readonly CommentTextSegment[]): MessageComposerMessage {
  const message: MessageComposerMessage = { text, tokens: [] };
  let at = 0;
  for (const segment of segments) {
    const start = text.indexOf(segment.text, at);
    if (start < 0) break;
    at = start + segment.text.length;
    if (segment.kind === 'mention') {
      message.tokens.push({
        start,
        end: at,
        kind: 'trigger',
        id: segment.id,
        label: segment.name,
        trigger: mentionTrigger,
      });
    }
  }
  return message;
}

/** The text box with mentions, as `createCommentMentions` draws it. */
export function CommentMentionField({
  field,
  mentions,
}: {
  field: CommentMentionFieldProps;
  mentions: CommentMentions;
}) {
  const strings = useUiStrings();
  const triggers = useMemo(() => [toMentionTrigger(mentions, strings)], [mentions, strings]);
  const { value } = field;
  const { parse } = mentions;
  const message = useMemo(() => toMessage(value, parse(value)), [value, parse]);
  return (
    <RichMessageField
      className={field.className}
      aria-label={field.label}
      placeholder={field.placeholder}
      isDisabled={field.isDisabled}
      autoFocus={field.autoFocus}
      minRows={2}
      triggers={triggers}
      value={message}
      onChange={(next) => field.onChange(next.text)}
    />
  );
}
