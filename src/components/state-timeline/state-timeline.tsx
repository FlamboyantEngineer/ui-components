import type { ReactNode } from 'react';
import { VisuallyHidden } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, NativeProps, SortDirection, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { Attribution, type AttributionProps } from '../attribution/attribution.js';
import type { AvatarIdentity } from '../avatar/avatar.js';
import { Badge } from '../badge/badge.js';

/** A state in the history: its name in a toned badge. */
export interface StateTimelineState {
  /** Identifies the entry. */
  id: Key;
  /** The state's name. */
  label: ReactNode;
  /** The badge's tone. Defaults to `neutral`. */
  tone?: Tone | undefined;
}

/** A change into a state: who made it, when, and why. */
export interface StateTimelineEntry extends StateTimelineState {
  /** When the state was entered: an ISO 8601 date or date and time. */
  time?: string | null | undefined;
  /** Who moved it into the state. */
  person?: AvatarIdentity | undefined;
  /** A note left with the change. */
  comment?: ReactNode;
}

/** Where an entry sits: before the current state, the current state, or not reached yet. */
type StateTimelineStatus = 'past' | 'current' | 'upcoming';

export interface StateTimelineProps
  extends
    BaseProps,
    AriaLabellingProps,
    Pick<NativeProps<'ol'>, 'ref'>,
    Pick<AttributionProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'> {
  /** The state changes, oldest first; the last one is the current state. */
  entries: readonly StateTimelineEntry[];
  /** States not reached yet, in the order they would come. */
  upcoming?: readonly StateTimelineState[] | undefined;
  /** `ascending` (the default) lists the oldest change first, `descending` the newest. */
  direction?: SortDirection | undefined;
}

interface TimelineRow {
  entry: StateTimelineEntry;
  status: StateTimelineStatus;
}

type EntryProps = TimelineRow &
  Pick<StateTimelineProps, 'showAvatar' | 'fallbackAfterDays' | 'getNow'>;

const hooks = createHooks('state-timeline', [
  'entry',
  'marker',
  'body',
  'header',
  'state',
  'current',
  'attribution',
  'comment',
]);

/** The rows in reading order: the changes, then the states to come, reversed for `descending`. */
function toRows(
  entries: readonly StateTimelineEntry[],
  upcoming: readonly StateTimelineState[],
  direction: SortDirection,
): TimelineRow[] {
  const rows: TimelineRow[] = [
    ...entries.map((entry, index) => ({
      entry,
      status: (index === entries.length - 1 ? 'current' : 'past') as StateTimelineStatus,
    })),
    ...upcoming.map((entry) => ({ entry, status: 'upcoming' as const })),
  ];
  return direction === 'descending' ? rows.reverse() : rows;
}

function Entry({ entry, status, showAvatar, fallbackAfterDays, getNow }: EntryProps) {
  const strings = useUiStrings();
  const isCurrent = status === 'current';
  const hasAttribution = status !== 'upcoming' && (entry.time || entry.person);
  return (
    <li {...hooks.slot('entry', { status })} aria-current={isCurrent ? 'step' : undefined}>
      <span {...hooks.slot('marker')} aria-hidden="true" />
      <div {...hooks.slot('body')}>
        <div {...hooks.slot('header')}>
          <Badge
            variant="status"
            tone={entry.tone ?? 'neutral'}
            announce={false}
            className={hooks.slotClass('state')}
          >
            {entry.label}
          </Badge>
          {isCurrent ? (
            <>
              {' '}
              <span {...hooks.slot('current')}>{strings.currentState}</span>
            </>
          ) : null}
          {status === 'upcoming' ? (
            <>
              {' '}
              <VisuallyHidden elementType="span">{strings.upcomingState}</VisuallyHidden>
            </>
          ) : null}
          {hasAttribution ? (
            <Attribution
              time={entry.time}
              person={entry.person}
              showAvatar={showAvatar}
              fallbackAfterDays={fallbackAfterDays}
              getNow={getNow}
              className={hooks.slotClass('attribution')}
            />
          ) : null}
        </div>
        {isEmptyNode(entry.comment) ? null : <div {...hooks.slot('comment')}>{entry.comment}</div>}
      </div>
    </li>
  );
}

/**
 * A vertical history of the states something went through: each change's state badge, who made it
 * and when, and an optional comment, with the current state marked and the states still to come.
 */
export function StateTimeline({
  entries,
  upcoming = [],
  direction = 'ascending',
  showAvatar,
  fallbackAfterDays,
  getNow,
  className,
  ...rest
}: StateTimelineProps) {
  const strings = useUiStrings();
  const named = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined;
  return (
    <ol
      aria-label={named ? undefined : strings.stateHistory}
      {...rest}
      {...hooks.root({ className, props: rest, data: { direction } })}
    >
      {toRows(entries, upcoming, direction).map(({ entry, status }) => (
        <Entry
          key={`${status === 'upcoming' ? 'upcoming' : 'entry'}:${toKeyIdentity(entry.id)}`}
          entry={entry}
          status={status}
          showAvatar={showAvatar}
          fallbackAfterDays={fallbackAfterDays}
          getNow={getNow}
        />
      ))}
    </ol>
  );
}
