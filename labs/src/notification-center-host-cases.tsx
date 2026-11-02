import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NotificationCenter } from '../../src/components/notification-center/notification-center.js';
import {
  NotificationList,
  type NotificationFilter,
  type NotificationItem,
} from '../../src/components/notification-center/index.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { ZoneComparison, getNearMidnightNow, nearMidnightInstant } from './time-zone-samples.js';

const getNow = () => new Date('2026-04-20T10:30:00Z');

/** The server's pages, one per filter, as a host that loads each filter itself keeps them. */
const serverPages: Record<NotificationFilter, NotificationItem[]> = {
  all: [
    { id: 'mention', title: 'Maria Santos mentioned you', time: '2026-04-20T10:12:00Z' },
    { id: 'invite', title: 'Lena Ortiz invited you', time: '2026-04-20T09:05:00Z' },
    {
      id: 'import',
      title: 'Import of Orchard.csv finished',
      time: '2026-04-20T07:40:00Z',
      isRead: true,
    },
  ],
  unread: [
    { id: 'mention', title: 'Maria Santos mentioned you', time: '2026-04-20T10:12:00Z' },
    { id: 'invite', title: 'Lena Ortiz invited you', time: '2026-04-20T09:05:00Z' },
  ],
};

function useChoice<T extends string>(options: readonly T[], initial: T) {
  const [value, setValue] = useState<T>(initial);
  const choose = (next: unknown) => {
    const match = options.find((option) => option === next);
    if (match) setValue(match);
  };
  return [value, choose] as const;
}

function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: unknown) => void;
}) {
  return (
    <SegmentedChoice
      aria-label={label}
      size="sm"
      sizing="content"
      options={options.map((option) => ({ value: option, label: option }))}
      value={value}
      onChange={onChange}
    />
  );
}

const presentations = ['popover', 'drawer'] as const;
const placements = ['bottom end', 'bottom start', 'top'] as const;
const countMaxima = ['99', '9'] as const;

/** A bell whose open state and filter the page owns; each filter loads from the server. */
function OwnedCenter() {
  const [presentation, setPresentation] = useChoice(presentations, 'popover');
  const [placement, setPlacement] = useChoice(placements, 'bottom start');
  const [countMax, setCountMax] = useChoice(countMaxima, '9');
  const [isOpen, setOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [items, setItems] = useState(serverPages.all);
  const [isLoading, setLoading] = useState(false);
  const [requests, setRequests] = useState<string[]>([]);
  const load = (next: NotificationFilter) => {
    setFilter(next);
    setLoading(true);
    setRequests((list) => [...list, next]);
    window.setTimeout(() => {
      setItems(serverPages[next]);
      setLoading(false);
    }, 600);
  };
  return (
    <div data-lab-demo="owned-center">
      <Choice
        label="Presentation"
        options={presentations}
        value={presentation}
        onChange={setPresentation}
      />{' '}
      <Choice label="Placement" options={placements} value={placement} onChange={setPlacement} />{' '}
      <Choice label="Count maximum" options={countMaxima} value={countMax} onChange={setCountMax} />
      <p>
        <Button size="sm" variant="secondary" onPress={() => setOpen(true)}>
          Open from the page
        </Button>{' '}
        <Button size="sm" variant="secondary" onPress={() => load('unread')}>
          Show unread from the page
        </Button>
      </p>
      <NotificationCenter
        data-lab-owned-center
        items={items}
        unreadCount={12}
        countMax={Number(countMax)}
        presentation={presentation}
        placement={placement}
        isOpen={isOpen}
        onOpenChange={setOpen}
        filter={filter}
        onFilterChange={load}
        isLoading={isLoading}
        getNow={getNow}
        onMarkAllRead={() => undefined}
      />
      <LabOutput name="open">{isOpen ? 'open' : 'closed'}</LabOutput>
      <LabOutput name="filter">{`${filter}${isLoading ? ', loading' : ''}`}</LabOutput>
      <LabOutput name="requests">{requests.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

/** A bell the reader mounts already open. */
function OpenOnMount() {
  const [mount, setMount] = useState(0);
  return (
    <div data-lab-demo="center-open-on-mount">
      <Button size="sm" onPress={() => setMount((count) => count + 1)}>
        Mount a bell open
      </Button>{' '}
      {mount > 0 ? (
        <NotificationCenter
          key={mount}
          defaultOpen
          items={serverPages.all}
          getNow={getNow}
          title="Kitchen alerts"
        />
      ) : null}
    </div>
  );
}

const thresholds = ['1', '7'] as const;

/** A quiet list whose arrivals the page announces itself, read in a chosen zone and threshold. */
function QuietList() {
  const [threshold, setThreshold] = useChoice(thresholds, '7');
  const [items, setItems] = useState<NotificationItem[]>([
    { id: 'night', title: 'Proofing finished', time: nearMidnightInstant },
    { id: 'early', title: 'Oven preheated', time: '2026-04-17T12:00:00Z', isRead: true },
  ]);
  const [announcement, setAnnouncement] = useState('');
  const add = () => {
    const title = `Batch ${String(items.length)} ready`;
    setItems((list) => [
      { id: `batch-${String(list.length)}`, title, time: '2026-04-20T23:20:00Z' },
      ...list,
    ]);
    setAnnouncement(`New in the kitchen: ${title}`);
  };
  return (
    <div data-lab-demo="quiet-list">
      <Choice
        label="Dates after (days)"
        options={thresholds}
        value={threshold}
        onChange={setThreshold}
      />{' '}
      <Button size="sm" onPress={add}>
        Add an arrival
      </Button>
      <p role="status" data-lab-host-announcement="">
        {announcement}
      </p>
      <ZoneComparison>
        {({ timeZone }) => (
          <NotificationList
            items={items}
            announcesArrivals={false}
            getNow={getNearMidnightNow}
            timeZone={timeZone}
            fallbackAfterDays={Number(threshold)}
          />
        )}
      </ZoneComparison>
      <LabOutput name="arrivals">{String(items.length - 2)}</LabOutput>
    </div>
  );
}

export function NotificationCenterHostCases() {
  return (
    <div data-lab-family="notification-center-host-cases">
      <LabSection
        title="Page-owned bell"
        description="The page owns whether the panel is open and which filter shows: it opens the panel and switches to unread from outside, and each filter the reader picks loads its own page from a pretend server. Choose the presentation, a popover placement and a count maximum of 9, which shows the 12 unread as 9+."
      >
        <OwnedCenter />
      </LabSection>
      <LabSection
        title="Open on mount"
        description="defaultOpen opens a bell's panel as it mounts, here under its own title."
      >
        <OpenOnMount />
      </LabSection>
      <LabSection
        title="Quiet list and time policy"
        description="A list with announcesArrivals off, under a page whose own status announces each arrival once. The clock is fixed at 20 April 2026, 23:30 UTC: the zone moves the day headings and times, and a one-day threshold turns older times into dates."
      >
        <QuietList />
      </LabSection>
    </div>
  );
}
