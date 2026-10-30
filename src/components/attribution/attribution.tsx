'use client';

import { Fragment, type ReactNode } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { Avatar, getDisplayName, type AvatarIdentity } from '../avatar/avatar.js';
import { RelativeTime, type RelativeTimeProps } from '../relative-time/relative-time.js';
import { UserCardTrigger, type UserCardTriggerType } from '../user-card/user-card.js';
import { isTimeFirst, parseAttributionTemplate } from './attribution-template.js';

export interface AttributionProps
  extends BaseProps, Pick<RelativeTimeProps, 'fallbackAfterDays' | 'getNow'> {
  /** When it happened: an ISO 8601 date or date and time. */
  time: string | null | undefined;
  /** Who did it. */
  person?: AvatarIdentity | undefined;
  /**
   * The sentence, with `{time}` and `{person}` tokens (`Edited {time} by {person}`). Defaults to the
   * provider's `attribution` string with a person and to `{time}` alone without one.
   */
  template?: string | undefined;
  /** Draws the person's avatar before their name. */
  showAvatar?: boolean | undefined;
  /** A card about the person, usually a `UserCard`, that their name opens. */
  card?: ReactNode;
  /** How `card` opens: on press (the default), or on hover and keyboard focus after a delay. */
  cardTrigger?: UserCardTriggerType | undefined;
}

const hooks = createHooks('attribution', ['time', 'person', 'avatar', 'name']);

/** The person's avatar and name, as a card trigger when there is a card. */
function AttributionPerson({
  person,
  showAvatar,
  card,
  cardTrigger,
}: Pick<AttributionProps, 'person' | 'showAvatar' | 'card' | 'cardTrigger'>) {
  const strings = useUiStrings();
  const content = (
    <>
      {person && showAvatar ? (
        <Avatar {...person} size="xs" decorative className={hooks.slotClass('avatar')} />
      ) : null}
      <span {...hooks.slot('name')}>{getDisplayName(person?.name ?? '', strings.unnamed)}</span>
    </>
  );
  if (!card) return <span {...hooks.slot('person')}>{content}</span>;
  return (
    <UserCardTrigger card={card} trigger={cardTrigger} className={hooks.slotClass('person')}>
      {content}
    </UserCardTrigger>
  );
}

/**
 * Who did something and when, as one sentence (`Edited 5 minutes ago by Maria Santos`): literal text
 * from a template, a live `RelativeTime` and the person's name, which can open their card.
 */
export function Attribution({
  time,
  person,
  template,
  showAvatar = false,
  card,
  cardTrigger,
  fallbackAfterDays,
  getNow,
  className,
  ...rest
}: AttributionProps) {
  const strings = useUiStrings();
  const segments = parseAttributionTemplate(template ?? (person ? strings.attribution : '{time}'));
  const capitalize = isTimeFirst(segments);
  return (
    <span {...rest} {...hooks.root({ className })}>
      {segments.map((segment) => {
        if (segment.kind === 'text')
          return <Fragment key={segment.offset}>{segment.text}</Fragment>;
        if (segment.kind === 'person') {
          return (
            <AttributionPerson
              key={segment.offset}
              person={person}
              showAvatar={showAvatar}
              card={card}
              cardTrigger={cardTrigger}
            />
          );
        }
        return (
          <RelativeTime
            key={segment.offset}
            value={time}
            fallbackAfterDays={fallbackAfterDays}
            getNow={getNow}
            capitalize={capitalize}
            placeholder={strings.unknownTime}
            className={hooks.slotClass('time')}
          />
        );
      })}
    </span>
  );
}
