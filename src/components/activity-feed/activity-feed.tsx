'use client';

import { useId, type ReactNode } from 'react';
import { useLocale } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { useNow, useTimeZone } from '../../core/clock.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, NativeProps } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { capitalizeText } from '../../utils/relative-time.js';
import { requireDefined } from '../../utils/require-defined.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Avatar, getDisplayName, type AvatarIdentity } from '../avatar/avatar.js';
import { EmptyState } from '../empty-state/empty-state.js';
import { Icon, type IconSource } from '../icon/icon.js';
import { toIconProps } from '../icon/icon.js';
import { LoadMore, type LoadMoreProps } from '../load-more/load-more.js';
import { RelativeTime, type RelativeTimeProps } from '../relative-time/relative-time.js';
import { useHeadingLevel, type HeadingLevel } from '../section-header/section-header.js';
import { groupByDay } from './day-groups.js';

/** One event: who did what to what, and when. */
export interface ActivityFeedItem {
  /** Identifies the entry. */
  id: Key;
  /** Who did it. */
  person?: AvatarIdentity | undefined;
  /** What they did: a verb phrase such as `commented on` or `changed the status of`. */
  action: ReactNode;
  /** What they did it to. */
  target?: ReactNode;
  /** When it happened: an ISO 8601 date or date and time. */
  time: string;
  /** More about the event under its summary: a comment, a `ChangeList`, attachments. */
  detail?: ReactNode;
  /** A glyph in the entry's marker instead of the person's avatar. */
  icon?: IconSource;
}

/** `day` groups entries under a heading per calendar day; `none` lists them without headings. */
export type ActivityFeedGrouping = 'day' | 'none';

export interface ActivityFeedProps
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<NativeProps<'div'>, 'ref'>,
    Pick<RelativeTimeProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'> {
  /** The events, in the order to show them (usually newest first). */
  items: readonly ActivityFeedItem[];
  /** How entries are grouped. Defaults to `day`. */
  groupBy?: ActivityFeedGrouping | undefined;
  /** The level of the day headings. Defaults to one below the enclosing section's, else 3. */
  headingLevel?: HeadingLevel | undefined;
  /** Controls above the feed that choose which events it shows, such as a `SegmentedChoice`. */
  filter?: ReactNode;
  /** Requests older events when the end of the feed comes into view. Omit when there are no more. */
  onLoadMore?: LoadMoreProps['onLoadMore'];
  /** Events are loading: the feed is busy and its load-more control pending. */
  isLoading?: boolean | undefined;
  /** Draws the feed while it has no entries and is not loading. */
  renderEmptyState?: (() => ReactNode) | undefined;
}

type EntryOptions = Pick<ActivityFeedProps, 'fallbackAfterDays' | 'getNow' | 'timeZone'>;

const hooks = createHooks('activity-feed', [
  'filter',
  'list',
  'group',
  'day',
  'entries',
  'entry',
  'marker',
  'body',
  'summary',
  'actor',
  'action',
  'target',
  'time',
  'detail',
  'load-more',
]);

/** The marker beside an entry: its glyph, else its person's avatar, else an empty dot. */
function EntryMarker({ item }: { item: ActivityFeedItem }) {
  let content: ReactNode = null;
  if (item.icon) content = <Icon {...toIconProps(item.icon)} />;
  else if (item.person) content = <Avatar {...item.person} size="sm" decorative />;
  return (
    <span {...hooks.slot('marker')} aria-hidden="true">
      {content}
    </span>
  );
}

function Entry({ item, options }: { item: ActivityFeedItem; options: EntryOptions }) {
  const strings = useUiStrings();
  return (
    <li {...hooks.slot('entry')}>
      <EntryMarker item={item} />
      <div {...hooks.slot('body')}>
        <p {...hooks.slot('summary')}>
          {item.person ? (
            <>
              <span {...hooks.slot('actor')}>
                {getDisplayName(item.person.name, strings.unnamed)}
              </span>{' '}
            </>
          ) : null}
          <span {...hooks.slot('action')}>{item.action}</span>
          {isEmptyNode(item.target) ? null : (
            <>
              {' '}
              <span {...hooks.slot('target')}>{item.target}</span>
            </>
          )}
        </p>
        <RelativeTime
          value={item.time}
          fallbackAfterDays={options.fallbackAfterDays}
          getNow={options.getNow}
          timeZone={options.timeZone}
          placeholder={strings.unknownTime}
          className={hooks.slotClass('time')}
        />
        {isEmptyNode(item.detail) ? null : <div {...hooks.slot('detail')}>{item.detail}</div>}
      </div>
    </li>
  );
}

/** The entries under a heading per day. */
function DayGroups({
  items,
  options,
  headingLevel,
}: {
  items: readonly ActivityFeedItem[];
  options: EntryOptions;
  headingLevel: HeadingLevel | undefined;
}) {
  const strings = useUiStrings();
  const { locale } = useLocale();
  const baseId = useId();
  const Heading = `h${useHeadingLevel(headingLevel)}` as const;
  // Before the clock may be read every heading is its date, as the server rendered it.
  const groups = groupByDay(items, {
    now: useNow(options.getNow),
    timeZone: useTimeZone(options.timeZone),
    locale,
    unknownLabel: capitalizeText(strings.unknownTime, locale),
  });
  return groups.map((group, index) => {
    const headingId = `${baseId}-${index}`;
    return (
      <li
        key={`${group.day}:${toKeyIdentity(requireDefined(group.items[0]).id)}`}
        {...hooks.slot('group')}
      >
        <Heading {...hooks.slot('day')} id={headingId}>
          {group.label}
        </Heading>
        <ol {...hooks.slot('entries')} aria-labelledby={headingId}>
          {group.items.map((item) => (
            <Entry key={toKeyIdentity(item.id)} item={item} options={options} />
          ))}
        </ol>
      </li>
    );
  });
}

/** The entries' list, under day headings or not, named by the feed's labelling props. */
function FeedList({
  items,
  groupBy,
  headingLevel,
  options,
  isLoading,
  labelling,
}: Required<Pick<ActivityFeedProps, 'items' | 'groupBy' | 'isLoading'>> &
  Pick<ActivityFeedProps, 'headingLevel'> & {
    options: EntryOptions;
    labelling: AriaLabellingProps;
  }) {
  const strings = useUiStrings();
  const isNamed =
    labelling['aria-label'] !== undefined || labelling['aria-labelledby'] !== undefined;
  return (
    <ol
      {...labelling}
      aria-label={isNamed ? labelling['aria-label'] : strings.activity}
      {...hooks.slot('list')}
      aria-busy={isLoading || undefined}
    >
      {groupBy === 'day' ? (
        <DayGroups items={items} options={options} headingLevel={headingLevel} />
      ) : (
        items.map((item) => <Entry key={toKeyIdentity(item.id)} item={item} options={options} />)
      )}
    </ol>
  );
}

/**
 * A chronological feed of events (who did what to what, and when, with optional detail), grouped
 * under a heading per day, with a filter slot, loading of older events as the end comes into view,
 * and an empty state.
 */
export function ActivityFeed({
  items,
  groupBy = 'day',
  headingLevel,
  filter,
  onLoadMore,
  isLoading = false,
  renderEmptyState,
  fallbackAfterDays,
  getNow,
  timeZone,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-details': ariaDetails,
  ...rest
}: ActivityFeedProps) {
  const strings = useUiStrings();
  const isEmpty = items.length === 0;
  const labelling = {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-details': ariaDetails,
  };
  let content: ReactNode;
  if (isEmpty && isLoading) {
    content = <EmptyState variant="loading" size="sm" description={strings.loading} />;
  } else if (isEmpty) {
    content = renderEmptyState?.() ?? <EmptyState size="sm" description={strings.noActivity} />;
  } else {
    content = (
      <FeedList
        {...{ items, groupBy, headingLevel, isLoading, labelling }}
        options={{ fallbackAfterDays, getNow, timeZone }}
      />
    );
  }
  return (
    <div
      {...rest}
      {...hooks.root({ className, props: rest, data: { groupBy, loading: isLoading } })}
    >
      {isEmptyNode(filter) ? null : <div {...hooks.slot('filter')}>{filter}</div>}
      {content}
      {onLoadMore && !isEmpty ? (
        <LoadMore
          autoLoad
          onLoadMore={onLoadMore}
          isPending={isLoading || undefined}
          className={hooks.slotClass('load-more')}
        />
      ) : null}
    </div>
  );
}
