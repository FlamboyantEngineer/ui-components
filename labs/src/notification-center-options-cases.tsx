// The list's options passed through the bell's panel: the host's own controls after the filter, the
// unread filter at first, opening, reading and dismissing a notification, a row's own actions,
// times read in another zone with dates after a day, and a next page that fails once, which the
// host hears about. Beside it, a list whose filter the host holds and whose next page fails too.

import { useState } from 'react';
import { Button } from '../../src/components/button/index.js';
import {
  NotificationCenter,
  type NotificationFilter,
  type NotificationItem,
  NotificationList,
} from '../../src/components/notification-center/index.js';
import { InfoGlyph } from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const getNow = () => new Date(Date.UTC(2026, 3, 20, 10, 30));
const at = (day: number, hour: number) => new Date(Date.UTC(2026, 3, day, hour)).toISOString();

const PAGE: NotificationItem[] = [
  { id: 'build', title: 'Build 412 passed', icon: InfoGlyph, time: at(20, 9) },
  { id: 'review', title: 'Review requested on Pantry recipes', time: at(19, 15) },
  { id: 'digest', title: 'Weekly digest is ready', time: at(12, 8), isRead: true },
];
const MORE: NotificationItem[] = [
  { id: 'old', title: 'Import of Orchard.csv finished', time: at(2, 7), isRead: true },
];

/** A next page that fails the first time it is asked for. */
function usePages() {
  const [items, setItems] = useState(PAGE);
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState('none');
  const hasMore = items.length < PAGE.length + MORE.length;
  const onLoadMore = async () => {
    setAttempts((count) => count + 1);
    if (attempts === 0) throw new Error('The server is busy');
    await Promise.resolve();
    setItems((list) => [...list, ...MORE]);
  };
  const onLoadMoreError = (error: unknown) =>
    setFailed(error instanceof Error ? error.message : String(error));
  return { items, setItems, hasMore, onLoadMore, onLoadMoreError, failed };
}

function CenterOptions() {
  const pages = usePages();
  const [last, setLast] = useState('none');
  const dismiss = (key: Key) => {
    pages.setItems((list) => list.filter((item) => item.id !== key));
    setLast(`dismissed ${String(key)}`);
  };
  return (
    <div data-lab-demo="center-options">
      <NotificationCenter
        items={pages.items}
        getNow={getNow}
        timeZone="Asia/Tokyo"
        fallbackAfterDays={1}
        defaultFilter="unread"
        actions={<Button size="sm">Notification settings</Button>}
        hasMore={pages.hasMore}
        onLoadMore={pages.onLoadMore}
        onLoadMoreError={pages.onLoadMoreError}
        onAction={(key) => setLast(`opened ${String(key)}`)}
        onDismiss={dismiss}
        renderActions={(item) =>
          item.id === 'review' ? (
            <Button size="sm" onPress={() => setLast('accepted review')}>
              Accept
            </Button>
          ) : null
        }
      />
      <LabOutput name="last">{last}</LabOutput>
      <LabOutput name="load error">{pages.failed}</LabOutput>
    </div>
  );
}

function ListOptions() {
  const pages = usePages();
  const [filter, setFilter] = useState<NotificationFilter>('all');
  return (
    <div data-lab-demo="list-options">
      <Button size="sm" onPress={() => setFilter(filter === 'all' ? 'unread' : 'all')}>
        Host switches the filter
      </Button>
      <NotificationList
        items={pages.items}
        getNow={getNow}
        filter={filter}
        onFilterChange={setFilter}
        hasMore={pages.hasMore}
        onLoadMore={pages.onLoadMore}
        onLoadMoreError={pages.onLoadMoreError}
      />
      <LabOutput name="filter">{filter}</LabOutput>
      <LabOutput name="load error">{pages.failed}</LabOutput>
    </div>
  );
}

export function NotificationCenterOptionsCases() {
  return (
    <>
      <LabSection
        title="Panel options"
        description="The bell's panel with the host's settings button, opening on Unread, times in Tokyo with dates after a day, a row's own Accept action, opening and dismissing, and a next page that fails once (reported) and loads on the second try."
      >
        <CenterOptions />
      </LabSection>
      <LabSection
        title="A filter the host holds"
        description="The host switches the list's filter and hears the reader's choice; its next page fails once too."
      >
        <ListOptions />
      </LabSection>
    </>
  );
}
