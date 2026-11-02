import { BellGlyph, ErrorGlyph, InfoGlyph, SuccessGlyph } from '../../src/core/glyphs.js';
import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Link } from '../../src/components/link/link.js';
import { NotificationCenter } from '../../src/components/notification-center/notification-center.js';
import {
  NotificationList,
  type NotificationItem,
} from '../../src/components/notification-center/index.js';
import { NotificationCenterHostCases } from './notification-center-host-cases.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so the matrices read the same days and times on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 3, day, hour, minute).toISOString();

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };

const firstPage: NotificationItem[] = [
  {
    id: 1,
    title: 'Maria Santos mentioned you',
    description: 'Requirement 12',
    actor: maria,
    time: at(20, 10, 12),
    href: '#requirement-12',
  },
  {
    id: '1',
    title: 'Lena Ortiz invited you to Pantry recipes',
    actor: lena,
    time: at(20, 9, 5),
  },
  {
    id: 'import',
    title: 'Import of Orchard.csv finished',
    icon: SuccessGlyph,
    time: at(20, 7, 40),
    isRead: true,
  },
  {
    id: 'reply',
    title: 'Jon Berg replied to your comment',
    actor: jon,
    time: at(19, 16, 20),
    href: '#comment',
  },
  {
    id: 'digest',
    title: 'Weekly digest is ready',
    icon: InfoGlyph,
    time: at(14, 8, 0),
    isRead: true,
  },
];

const olderPage: NotificationItem[] = [
  { id: 'export', title: 'Export of Cities.xlsx failed', icon: ErrorGlyph, time: at(10, 15, 30) },
  {
    id: 'welcome',
    title: 'Welcome to the workspace',
    icon: BellGlyph,
    time: at(2, 9, 0),
    isRead: true,
  },
];

const counts = { none: 0, few: 3, many: 128 } as const;

/** A full inbox the reader works through: open, read, dismiss, accept and load more. */
function InboxDemo() {
  const [items, setItems] = useState(firstPage);
  const [hasMore, setHasMore] = useState(true);
  const markRead = (key: unknown, isRead = true) =>
    setItems((list) => list.map((item) => (item.id === key ? { ...item, isRead } : item)));
  const dismiss = (key: unknown) => setItems((list) => list.filter((item) => item.id !== key));
  return (
    <NotificationList
      data-lab-inbox
      items={items}
      getNow={getNow}
      onAction={(key) => markRead(key)}
      onReadChange={markRead}
      onDismiss={dismiss}
      onMarkAllRead={() => setItems((list) => list.map((item) => ({ ...item, isRead: true })))}
      renderActions={(item) =>
        item.id === '1' ? (
          <Button size="sm" onPress={() => dismiss(item.id)}>
            Accept
          </Button>
        ) : null
      }
      actions={<Link href="#settings">Settings</Link>}
      hasMore={hasMore}
      onLoadMore={() => {
        setItems((list) => [...list, ...olderPage]);
        setHasMore(false);
      }}
    />
  );
}

/** An unread inbox whose loaded page holds only read notifications: Load more stays. */
function UnreadLaterDemo() {
  const [items, setItems] = useState(firstPage.slice(4));
  const [hasMore, setHasMore] = useState(true);
  return (
    <NotificationList
      data-lab-unread-later
      items={items}
      getNow={getNow}
      defaultFilter="unread"
      unreadCount={hasMore ? 1 : items.filter((item) => !item.isRead).length}
      hasMore={hasMore}
      onLoadMore={() =>
        new Promise<void>((resolve) => {
          window.setTimeout(() => {
            setItems((list) => [...list, ...olderPage]);
            setHasMore(false);
            resolve();
          }, 600);
        })
      }
    />
  );
}

/** A bell on the real clock: each new notification is announced, open or closed. */
function LiveDemo() {
  const [items, setItems] = useState<NotificationItem[]>(() => [
    {
      id: 'live-0',
      title: 'Workspace created',
      icon: BellGlyph,
      time: new Date().toISOString(),
      isRead: true,
    },
  ]);
  const add = () =>
    setItems((list) => [
      {
        id: `live-${list.length}`,
        title: `Build ${list.length} passed`,
        icon: SuccessGlyph,
        time: new Date().toISOString(),
      },
      ...list,
    ]);
  return (
    <div>
      <NotificationCenter
        data-lab-live
        items={items}
        onReadChange={(key, isRead) =>
          setItems((list) => list.map((item) => (item.id === key ? { ...item, isRead } : item)))
        }
        onMarkAllRead={() => setItems((list) => list.map((item) => ({ ...item, isRead: true })))}
      />{' '}
      <Button size="sm" onPress={add}>
        Add a notification
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Bell"
      description="The bell's count and the panel it opens: a popover against the bell, or a drawer from the end edge for narrow screens. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{
          unread: ['none', 'few', 'many'] as const,
          presentation: ['popover', 'drawer'] as const,
        }}
        render={({ unread, presentation }) => (
          <NotificationCenter
            items={
              unread === 'none' ? firstPage.map((item) => ({ ...item, isRead: true })) : firstPage
            }
            unreadCount={counts[unread]}
            presentation={presentation}
            getNow={getNow}
            onMarkAllRead={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Inbox"
      description="The list on its own, as a full-page inbox: filter to unread, open a row to read it, mark rows read or unread, dismiss them, accept an invitation, and load the older page as it scrolls into view."
    >
      <InboxDemo />
    </LabSection>
    <LabSection
      title="Empty and loading"
      description="Loading before the first page, nothing at all, and nothing unread."
    >
      <StateMatrix
        axes={{ state: ['loading', 'empty', 'nothing unread'] as const }}
        render={({ state }) => (
          <NotificationList
            items={state === 'nothing unread' ? firstPage.slice(2, 3) : []}
            isLoading={state === 'loading'}
            defaultFilter={state === 'nothing unread' ? 'unread' : 'all'}
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Unread on a later page"
      description="Under the unread filter, the loaded page holds only a read notification while the count says one is unread: the list does not say the reader is caught up, and Load more brings the older page with the unread one."
    >
      <UnreadLaterDemo />
    </LabSection>
    <LabSection
      title="Live"
      description="Notifications stamped on the real clock. Each arrival is announced politely, whether the panel is open or not. The filter chosen in the panel stays when it closes and opens again."
    >
      <LiveDemo />
    </LabSection>
    <NotificationCenterHostCases />
  </>,
);
