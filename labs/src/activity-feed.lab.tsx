import { useState } from 'react';
import {
  ActivityFeed,
  type ActivityFeedItem,
} from '../../src/components/activity-feed/activity-feed.js';
import { ChangeList } from '../../src/components/change-list/change-list.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so every heading and time in the matrices reads the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };

const events: ActivityFeedItem[] = [
  {
    id: 1,
    person: maria,
    action: 'commented on',
    target: 'Requirement 12',
    time: '2026-04-20T10:18:00',
    detail: 'The tolerance should be stated in millimetres.',
  },
  {
    id: '1',
    person: jon,
    action: 'changed',
    target: 'Requirement 12',
    time: '2026-04-20T09:02:00',
    detail: (
      <ChangeList
        changes={[
          { id: 'status', label: 'Status', before: 'Draft', after: 'In review' },
          { id: 'owner', label: 'Owner', before: 'Jon Berg', after: 'Lena Ortiz' },
        ]}
      />
    ),
  },
  {
    id: 'upload',
    person: lena,
    action: 'attached',
    target: 'Report.pdf',
    time: '2026-04-19T17:45:00',
  },
  {
    id: 'import',
    icon: 'refresh',
    action: 'Nightly import finished with 3 new records',
    time: '2026-04-19T02:00:00',
  },
  {
    id: 'created',
    person: maria,
    action: 'created',
    target: 'Requirement 12',
    time: '2026-04-14T11:30:00',
  },
];

type FeedState = 'entries' | 'loading more' | 'loading' | 'empty';

function stateProps(state: FeedState) {
  if (state === 'empty') return { items: [] };
  if (state === 'loading') return { items: [], isLoading: true };
  if (state === 'loading more') return { items: events, isLoading: true, onLoadMore: () => {} };
  return { items: events };
}

type Kind = 'all' | 'comments' | 'changes';

/** An event with the kind the lab's filter picks by. */
type KindedEvent = ActivityFeedItem & { kind: Exclude<Kind, 'all'> };

const kindedEvents: KindedEvent[] = events.map((item) => ({
  ...item,
  kind: item.id === 1 ? 'comments' : 'changes',
}));

/** Older events made up on demand, a page at a time. */
function olderPage(page: number): KindedEvent[] {
  return [0, 1, 2].map((index) => {
    const day = 13 - page * 2 - Math.floor(index / 2);
    return {
      id: `older-${page}-${index}`,
      person: [maria, jon, lena][index]!,
      action: index === 1 ? 'commented on' : 'edited',
      target: `Requirement ${page * 3 + index + 1}`,
      time: `2026-04-${String(day).padStart(2, '0')}T${10 + index}:00:00`,
      detail: index === 1 ? 'Agreed, please go ahead.' : undefined,
      kind: index === 1 ? 'comments' : 'changes',
    };
  });
}

/** A feed filtered by kind that loads older events, a page at a time, as its end comes into view. */
function FilteredFeed() {
  const [kind, setKind] = useState<Kind>('all');
  const [older, setOlder] = useState<KindedEvent[]>([]);
  const [isLoading, setLoading] = useState(false);
  const pages = older.length / 3;
  const all = [...kindedEvents, ...older];
  const shown = kind === 'all' ? all : all.filter((item) => item.kind === kind);
  const loadMore = () => {
    setLoading(true);
    window.setTimeout(() => {
      setOlder((list) => [...list, ...olderPage(list.length / 3)]);
      setLoading(false);
    }, 400);
  };
  return (
    <div data-lab-demo="filtered">
      <ActivityFeed
        aria-label="Requirement activity"
        items={shown}
        getNow={getNow}
        isLoading={isLoading}
        onLoadMore={pages < 2 ? loadMore : undefined}
        filter={
          <SegmentedChoice
            aria-label="Show"
            sizing="content"
            options={[
              { value: 'all', label: 'All' },
              { value: 'comments', label: 'Comments' },
              { value: 'changes', label: 'Changes' },
            ]}
            value={kind}
            onChange={(value) => setKind((value as Kind | null) ?? 'all')}
          />
        }
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States and grouping"
      description="Entries under day headings or in one run, while older events load, while the first page loads, and empty. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{
          state: ['entries', 'loading more', 'loading', 'empty'],
          groupBy: ['day', 'none'],
        }}
        render={({ state, groupBy }) => (
          <ActivityFeed
            aria-label={`Activity, ${state}, ${groupBy}`}
            groupBy={groupBy}
            getNow={getNow}
            {...stateProps(state)}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Times"
      description="Times read relative to now for a week by default, or as dates after one day."
    >
      <StateMatrix
        axes={{ fallback: ['7 days', '1 day'] }}
        render={({ fallback }) => (
          <ActivityFeed
            aria-label={`Activity, ${fallback} fallback`}
            items={events.slice(2)}
            groupBy="none"
            fallbackAfterDays={fallback === '7 days' ? 7 : 1}
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Filter and older events"
      description="A filter in the feed's slot narrows the events; scrolling to the end loads two older pages."
    >
      <FilteredFeed />
    </LabSection>
  </>,
);
