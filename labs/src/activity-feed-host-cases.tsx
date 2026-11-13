import { useState } from 'react';
import {
  ActivityFeed,
  type ActivityFeedItem,
} from '../../src/components/activity-feed/activity-feed.js';
import { Button } from '../../src/components/button/button.js';
import { EmptyState } from '../../src/components/empty-state/empty-state.js';
import { Section } from '../../src/components/section-header/section-header.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { getNearMidnightNow, nearMidnightInstant, ZoneComparison } from './time-zone-samples.js';

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', colorKey: 'jon' };

/**
 * Three events against a clock at 23:30 UTC: today in every sample zone, early today in UTC only,
 * and late on the 19th (two days ago in London).
 */
const nightEvents: ActivityFeedItem[] = [
  { id: 'late', person: maria, action: 'edited', target: 'Soup', time: '2026-04-20T23:10:00Z' },
  { id: 'early', person: jon, action: 'tasted', target: 'Bread', time: '2026-04-20T00:30:00Z' },
  { id: 'night', person: maria, action: 'added', target: 'Pears', time: nearMidnightInstant },
];

/** Day headings and entry times in the provider's zone or the feed's own. */
function ZonedFeed() {
  return (
    <div data-lab-demo="feed-zones">
      <ZoneComparison>
        {({ timeZone }) => (
          <ActivityFeed
            aria-label="Activity near midnight"
            items={nightEvents}
            getNow={getNearMidnightNow}
            timeZone={timeZone}
          />
        )}
      </ZoneComparison>
    </div>
  );
}

/** A feed inside a level 3 section, with level 3 day headings and a caller's empty state. */
function HostedFeed() {
  const [items, setItems] = useState<ActivityFeedItem[]>([]);
  return (
    <div data-lab-demo="feed-host">
      <Section title="Kitchen log" headingLevel={3} space="sm">
        <ActivityFeed
          aria-label="Kitchen log"
          items={items}
          headingLevel={3}
          getNow={getNearMidnightNow}
          renderEmptyState={() => (
            <EmptyState
              title="Nothing cooked yet"
              description="Events appear here as the kitchen works."
              headingLevel={3}
              actions={
                <Button size="sm" onPress={() => setItems(nightEvents.slice(0, 1))}>
                  Log a sample event
                </Button>
              }
            />
          )}
        />
      </Section>
      <Button size="sm" variant="secondary" onPress={() => setItems([])}>
        Clear the log
      </Button>
      <LabOutput name="events">{String(items.length)}</LabOutput>
    </div>
  );
}

const olderEvents: ActivityFeedItem[] = [
  { id: 'older', person: jon, action: 'renamed', target: 'Stew', time: '2026-04-12T08:00:00Z' },
];

/** A feed whose older page fails the first time, reported to the host, then loads on retry. */
function FailingPage() {
  const [items, setItems] = useState(nightEvents);
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState('none');
  const loadOlder = async () => {
    setAttempts((count) => count + 1);
    if (attempts === 0) throw new Error('The server is busy');
    await Promise.resolve();
    setItems((list) => [...list, ...olderEvents]);
  };
  return (
    <div data-lab-demo="feed-load-error">
      <ActivityFeed
        aria-label="Feed whose next page fails once"
        items={items}
        getNow={getNearMidnightNow}
        onLoadMore={items.length > nightEvents.length ? undefined : loadOlder}
        onLoadMoreError={(error) =>
          setFailed(error instanceof Error ? error.message : String(error))
        }
      />
      <LabOutput name="load error">{failed}</LabOutput>
    </div>
  );
}

export function ActivityFeedHostCases() {
  return (
    <div data-lab-family="activity-feed-host-cases">
      <LabSection
        title="Time zones"
        description="The clock is fixed at 20 April 2026, 23:30 UTC. Day headings and entry times follow the provider's zone, or the feed's own timeZone when set: one event moves between Today, Yesterday and a full date."
      >
        <ZonedFeed />
      </LabSection>
      <LabSection
        title="Host heading level and empty state"
        description="Inside a level 3 section the day headings would be level 4; headingLevel sets them to 3, beside the section's own. While empty, the caller's renderEmptyState draws an action that logs an event."
      >
        <HostedFeed />
      </LabSection>
      <LabSection
        title="A next page that fails"
        description="The older page fails the first time it is asked for: onLoadMoreError hears the error and the feed offers the page again, which then loads."
      >
        <FailingPage />
      </LabSection>
    </div>
  );
}
