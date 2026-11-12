// Cases of the version history lab for state the host owns: the filter, the empty list, the time
// policy, and paging with a failed request and its retry.

import { useEffect, useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import {
  VersionHistory,
  type VersionHistoryFilter,
  type VersionHistoryVersion,
} from '../../src/components/version-history/index.js';

/** A fixed clock: 20 April 2026, 10:30 UTC. */
const getNow = () => new Date('2026-04-20T10:30:00Z');

const ana = { name: 'Ana Lima', colorKey: 'ana' };
const tom = { name: 'Tom Reyes', colorKey: 'tom' };

const versions: VersionHistoryVersion[] = [
  { id: 'v5', time: '2026-04-20T09:45:00Z', person: ana },
  { id: 'v4', label: 'Shared with the club', time: '2026-04-18T23:30:00Z', person: tom },
  { id: 'v3', time: '2026-04-17T14:00:00Z', person: tom },
  { id: 'v2', label: 'First plan', time: '2026-04-09T08:15:00Z', person: ana },
  { id: 'v1', time: '2026-04-02T19:00:00Z', person: ana },
];

function Output({ name, value }: { name: string; value: string }) {
  return (
    <p>
      {name}: <output data-lab-output={name}>{value}</output>
    </p>
  );
}

const everyVersion: VersionHistoryFilter = { namedOnly: false, person: null };

/** The filter owned by the host: outside buttons set it, the toolbar reports back. */
export function ControlledFilter() {
  const [filter, setFilter] = useState<VersionHistoryFilter>(everyVersion);
  return (
    <div data-lab-demo="controlled-filter">
      <p>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setFilter({ ...filter, namedOnly: true })}
        >
          Named versions only
        </Button>{' '}
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setFilter({ ...filter, person: 'Tom Reyes' })}
        >
          Only Tom Reyes
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => setFilter(everyVersion)}>
          Show every version
        </Button>
      </p>
      <VersionHistory
        aria-label="Garden plan versions, filter owned by the host"
        versions={versions}
        currentKey="v5"
        filter={filter}
        onFilterChange={setFilter}
        getNow={getNow}
        timeZone="UTC"
      />
      <Output name="filter" value={JSON.stringify(filter)} />
    </div>
  );
}

/** A history with no versions yet draws the host's empty content, here with an action. */
export function CustomEmpty() {
  const [saved, setSaved] = useState<VersionHistoryVersion[]>([]);
  return (
    <div data-lab-demo="custom-empty">
      <Button size="sm" variant="secondary" onPress={() => setSaved([])}>
        Clear the versions
      </Button>
      <VersionHistory
        aria-label="New plan versions"
        versions={saved}
        getNow={getNow}
        timeZone="UTC"
        renderEmptyState={() => (
          <div>
            <p>Nothing saved yet.</p>
            <Button
              size="sm"
              onPress={() => setSaved([{ id: 'first', time: '2026-04-20T10:00:00Z', person: ana }])}
            >
              Save a first version
            </Button>
          </div>
        )}
      />
    </div>
  );
}

const zones = {
  UTC: 'UTC',
  'Asia/Tokyo': 'Tokyo',
  'America/Los_Angeles': 'Los Angeles',
} as const;

type ZoneChoice = keyof typeof zones;

const isZone = (value: unknown): value is ZoneChoice =>
  typeof value === 'string' && Object.hasOwn(zones, value);

const fallbacks = { default: 'After 7 days (default)', one: 'After 1 day', month: 'After 30 days' };

const fallbackDays = { default: undefined, one: 1, month: 30 } as const;

type FallbackChoice = keyof typeof fallbackDays;

const isFallback = (value: unknown): value is FallbackChoice =>
  typeof value === 'string' && Object.hasOwn(fallbackDays, value);

/**
 * The time policy on a fixed clock: `timeZone` sets the zone automatic versions are titled in, and
 * `fallbackAfterDays` how many days back a time still reads as relative before the date shows.
 */
export function TimePolicy() {
  const [zone, setZone] = useState<ZoneChoice>('UTC');
  const [fallback, setFallback] = useState<FallbackChoice>('default');
  return (
    <div data-lab-demo="time-policy">
      <SegmentedChoice
        aria-label="Time zone"
        size="sm"
        sizing="content"
        options={Object.entries(zones).map(([value, label]) => ({ value, label }))}
        value={zone}
        onChange={(value) => {
          if (isZone(value)) setZone(value);
        }}
      />
      <SegmentedChoice
        aria-label="Dates replace relative times"
        size="sm"
        sizing="content"
        options={Object.entries(fallbacks).map(([value, label]) => ({ value, label }))}
        value={fallback}
        onChange={(value) => {
          if (isFallback(value)) setFallback(value);
        }}
      />
      <VersionHistory
        aria-label="Garden plan versions, time policy"
        versions={versions}
        currentKey="v5"
        showFilters={false}
        getNow={getNow}
        timeZone={zone}
        fallbackAfterDays={fallbackDays[fallback]}
      />
    </div>
  );
}

const pages: VersionHistoryVersion[][] = [0, 1, 2].map((page) =>
  [0, 1, 2].map((index) => {
    const day = 20 - (page * 3 + index);
    return {
      id: `page-${page + 1}-${index + 1}`,
      label: `Draft ${9 - (page * 3 + index)}`,
      time: `2026-04-${String(day).padStart(2, '0')}T09:00:00Z`,
      person: index % 2 === 0 ? ana : tom,
    };
  }),
);

/**
 * Paging that completes: each request takes 400 ms and appends three older versions, up to three
 * pages. The first request after a start fails, as a dropped connection would; Retry asks again.
 */
export function PagedHistory() {
  const [loaded, setLoaded] = useState(1);
  const [requests, setRequests] = useState(0);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failsNext, setFailsNext] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const request = () => {
    setRequests((count) => count + 1);
    setLoading(true);
    setError(null);
    timer.current = window.setTimeout(() => {
      setLoading(false);
      if (failsNext) {
        setFailsNext(false);
        setError('Older versions could not be loaded.');
        return;
      }
      setLoaded((count) => count + 1);
    }, 400);
  };
  const startAgain = () => {
    window.clearTimeout(timer.current);
    setLoaded(1);
    setRequests(0);
    setLoading(false);
    setError(null);
    setFailsNext(true);
  };
  return (
    <div data-lab-demo="paged">
      <Button size="sm" variant="secondary" onPress={startAgain}>
        Start again
      </Button>
      <VersionHistory
        aria-label="Draft versions, loaded in pages"
        versions={pages.slice(0, loaded).flat()}
        currentKey="page-1-1"
        showFilters={false}
        getNow={getNow}
        timeZone="UTC"
        onLoadMore={loaded < pages.length ? request : undefined}
        isLoading={isLoading}
        error={error}
        onRetry={request}
      />
      <Output name="requests" value={`${requests} requests, ${loaded} of ${pages.length} pages`} />
    </div>
  );
}

const folded: VersionHistoryVersion[] = [
  { id: 'f6', time: '2026-04-20T09:45:00Z', person: ana },
  {
    id: 'f5',
    label: 'Shared with the club',
    time: '2026-04-18T23:30:00Z',
    person: tom,
    children: [
      { id: 'f4', time: '2026-04-18T21:00:00Z', person: tom },
      { id: 'f3', time: '2026-04-17T14:00:00Z', person: ana },
    ],
  },
  {
    id: 'f2',
    label: 'First plan',
    time: '2026-04-09T08:15:00Z',
    person: ana,
    children: [{ id: 'f1', time: '2026-04-02T19:00:00Z', person: ana }],
  },
];

/** Automatic versions folded under the named version saved after them, with compare. */
export function FoldedHistory() {
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [compared, setCompared] = useState('none');
  return (
    <div data-lab-demo="folded">
      <VersionHistory
        aria-label="Folded history"
        versions={folded}
        getNow={getNow}
        onExpandedChange={(keys) => setExpanded([...keys].map(String))}
        onCompare={(keys) => setCompared(keys.join(' → '))}
      />
      <Output name="expanded" value={expanded.join(', ') || 'none'} />
      <Output name="compared" value={compared} />
    </div>
  );
}
