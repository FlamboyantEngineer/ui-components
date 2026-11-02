import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `${cellSelector(id)} .ui-activity-feed`;

test.describe('Activity Feed lab', () => {
  test('UIC-ACTIVITY-FEED-1.1 UIC-ACTIVITY-FEED-1.2 UIC-ACTIVITY-FEED-1.3 groups entries by day', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const feed = page.locator(cell('state=entries groupBy=day'));
    await expect(feed).toHaveAttribute('data-group-by', 'day');
    await expect(feed.locator('.ui-activity-feed__day')).toHaveText([
      'Today',
      'Yesterday',
      'Tuesday, April 14, 2026',
    ]);
    const today = feed.getByRole('list', { name: 'Today' });
    await expect(today.locator('.ui-activity-feed__summary')).toHaveText([
      'Maria Santos commented on Requirement 12',
      'Jon Berg changed Requirement 12',
    ]);
    await expect(today.locator('.ui-activity-feed__time').first()).toHaveText('12 minutes ago');
    await expect(today.locator('.ui-activity-feed__detail').first()).toHaveText(
      'The tolerance should be stated in millimetres.',
    );
    await expect(today.locator('.ui-activity-feed__detail .ui-change-list')).toBeVisible();
    const flat = page.locator(cell('state=entries groupBy=none'));
    await expect(flat.locator('.ui-activity-feed__day')).toHaveCount(0);
    await expect(flat.locator('.ui-activity-feed__entry')).toHaveCount(5);
    const dates = matrixCell(page, 'fallback=1 day').locator('.ui-activity-feed__time');
    await expect(dates.last()).toHaveText(/^Apr 14, 2026/);
    const markers = feed.locator('.ui-activity-feed__marker');
    const first = requireDefined(await markers.nth(0).boundingBox());
    const second = requireDefined(await markers.nth(1).boundingBox());
    expect(Math.round(first.x)).toBe(Math.round(second.x));
    expect(second.y).toBeGreaterThan(first.y);
  });

  test('UIC-ACTIVITY-FEED-2.2 UIC-ACTIVITY-FEED-2.3 shows loading and empty states', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const busy = page.locator(cell('state=loading more groupBy=day'));
    await expect(busy).toHaveAttribute('data-loading', 'true');
    await expect(busy.locator('.ui-activity-feed__list')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator(cell('state=loading groupBy=day')).getByRole('status')).toHaveText(
      /^Loading/,
    );
    await expect(page.locator(cell('state=empty groupBy=none'))).toHaveText('No activity yet.');
  });

  test('UIC-ACTIVITY-FEED-1.4 UIC-ACTIVITY-FEED-2.1 filters and loads older events', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const demo = page.locator('[data-lab-demo="filtered"]');
    const feed = demo.getByRole('list', { name: 'Requirement activity' });
    await expect(feed.locator('.ui-activity-feed__entry')).toHaveCount(5);
    const control = demo.locator('.ui-activity-feed__load-more');
    // Keep focus through loading so manual activation does not scroll the sentinel into view again.
    await control.focus();
    await expect(feed.locator('.ui-activity-feed__entry')).toHaveCount(8);
    await expect(control).toBeEnabled();
    await expect(control).not.toHaveAttribute('aria-disabled', 'true');
    await expect(control).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(feed.locator('.ui-activity-feed__entry')).toHaveCount(11);
    await expect(demo.locator('.ui-activity-feed__load-more')).toHaveCount(0);
    await demo.getByRole('radio', { name: 'Comments' }).click();
    await expect(feed.locator('.ui-activity-feed__action')).toHaveText([
      'commented on',
      'commented on',
      'commented on',
    ]);
  });

  test('UIC-ACTIVITY-FEED-1.3 keeps a typed reply as events arrive and leave', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const demo = page.locator('[data-lab-demo="live"]');
    const reply = demo.getByRole('textbox', { name: 'Reply' });
    await reply.fill('Keep my draft');
    await demo.getByRole('button', { name: 'Add an event' }).click();
    await demo.getByRole('button', { name: 'Add an event' }).click();
    await expect(demo.locator('.ui-activity-feed__entry')).toHaveCount(4);
    await demo.getByRole('button', { name: 'Remove the newest' }).click();
    await expect(demo.locator('.ui-activity-feed__entry')).toHaveCount(3);
    await expect(reply).toHaveValue('Keep my draft');
  });

  test('UIC-ACTIVITY-FEED-3.1 names each list and passes axe', async ({ page, lab }) => {
    await lab.open('activity-feed');
    await expect(page.getByRole('list', { name: 'Activity, entries, day' })).toBeVisible();
    await lab.expectAccessible();
  });
});

test.describe('Activity Feed host cases', () => {
  // A device zone unlike every sample zone, so only the provider and the override decide.
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('UIC-ACTIVITY-FEED-1.3 UIC-ACTIVITY-FEED-1.2 groups days and reads times in the chosen zone', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const demo = page.locator('[data-lab-demo="feed-zones"]');
    const headings = demo.getByRole('heading', { level: 3 });
    const pears = demo.locator('.ui-activity-feed__entry', { hasText: 'Pears' });
    await expect(headings).toHaveText(['Today', 'Yesterday']);
    await expect(pears.locator('.ui-activity-feed__time')).toHaveText('Yesterday');

    await demo
      .getByRole('radiogroup', { name: 'Provider time zone' })
      .getByRole('radio', { name: 'London' })
      .click();
    await expect(headings).toHaveText(['Today', 'Yesterday', 'Sunday, April 19, 2026']);
    await expect(pears.locator('.ui-activity-feed__time')).toHaveText('2 days ago');

    await demo
      .getByRole('radiogroup', { name: 'Override time zone' })
      .getByRole('radio', { name: 'Los Angeles' })
      .click();
    await expect(demo.locator('[data-lab-output="zone"]')).toHaveText('America/Los_Angeles');
    await expect(headings).toHaveText(['Today', 'Yesterday']);
    await expect(pears.locator('.ui-activity-feed__time')).toHaveText('Yesterday');
    await lab.expectAccessible('[data-lab-demo="feed-zones"]');
  });

  test('UIC-ACTIVITY-FEED-1.3 UIC-ACTIVITY-FEED-2.3 takes a heading level and draws the caller empty state', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    const demo = page.locator('[data-lab-demo="feed-host"]');
    await expect(demo.getByRole('heading', { name: 'Kitchen log', level: 3 })).toBeVisible();
    await expect(demo.getByRole('heading', { name: 'Nothing cooked yet', level: 3 })).toBeVisible();
    await demo.getByRole('button', { name: 'Log a sample event' }).click();
    await expect(demo.getByRole('heading', { name: 'Today', level: 3 })).toBeVisible();
    await expect(demo.locator('[data-lab-output="events"]')).toHaveText('1');
    await expect(demo.getByRole('heading', { name: 'Nothing cooked yet' })).toHaveCount(0);
    await demo.getByRole('button', { name: 'Clear the log' }).click();
    await expect(demo.getByRole('heading', { name: 'Nothing cooked yet', level: 3 })).toBeVisible();
    await lab.expectAccessible('[data-lab-demo="feed-host"]');
  });
});
