import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-activity-feed`;

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
    const dates = page.locator('[data-lab-cell="fallback=1 day"] .ui-activity-feed__time');
    await expect(dates.last()).toHaveText(/^Apr 14, 2026/);
    const markers = feed.locator('.ui-activity-feed__marker');
    const first = (await markers.nth(0).boundingBox())!;
    const second = (await markers.nth(1).boundingBox())!;
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
    await control.scrollIntoViewIfNeeded();
    await expect(feed.locator('.ui-activity-feed__entry')).toHaveCount(8);
    await expect(control).not.toHaveAttribute('aria-disabled', 'true');
    await control.click();
    await expect(feed.locator('.ui-activity-feed__entry')).toHaveCount(11);
    await expect(demo.locator('.ui-activity-feed__load-more')).toHaveCount(0);
    await demo.getByRole('radio', { name: 'Comments' }).click();
    await expect(feed.locator('.ui-activity-feed__action')).toHaveText([
      'commented on',
      'commented on',
      'commented on',
    ]);
  });

  test('UIC-ACTIVITY-FEED-3.1 names each list and passes axe in both themes', async ({
    page,
    lab,
  }) => {
    await lab.open('activity-feed');
    await expect(page.getByRole('list', { name: 'Activity, entries, day' })).toBeVisible();
    await lab.expectAccessible();
    await lab.open('activity-feed', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
