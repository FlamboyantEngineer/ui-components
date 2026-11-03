import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `${cellSelector(id)} .ui-notification-center`;

test.describe('Notification Center lab', () => {
  test('UIC-NOTIFICATION-CENTER-2.1 UIC-NOTIFICATION-CENTER-2.2 opens the inbox from the bell and closes back to it', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const center = page.locator(cell('unread=few presentation=popover'));
    const bell = center.getByRole('button', { name: 'Notifications, 3 unread' });
    await expect(center.locator('.ui-notification-center__count')).toHaveText('3');
    await expect(page.locator(cell('unread=many presentation=popover'))).toContainText('99+');
    await expect(page.locator(`${cell('unread=none presentation=popover')} .ui-badge`)).toHaveCount(
      0,
    );
    const bellBox = await bell.boundingBox();
    const countBox = await center.locator('.ui-notification-center__count').boundingBox();
    // The count sits over the bell's upper trailing corner.
    expect(countBox && bellBox && countBox.x > bellBox.x + bellBox.width / 2).toBe(true);
    await bell.click();
    const dialog = page.getByRole('dialog', { name: 'Notifications' });
    await expect(dialog).toBeVisible();
    await expect(center).toHaveAttribute('data-open', 'true');
    await expect(dialog.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Tuesday, April 14' })).toBeVisible();
    await expect(dialog).toHaveCount(1);
    await expect(page.locator('.ui-notification-center__panel')).not.toHaveAttribute(
      'data-entering',
    );
    await lab.expectAccessible('.ui-notification-center__panel');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(bell).toBeFocused();
  });

  test('UIC-NOTIFICATION-CENTER-2.2 opens the inbox in a drawer', async ({ page, lab }) => {
    await lab.open('notification-center');
    await page
      .locator(cell('unread=few presentation=drawer'))
      .getByRole('button', { name: /^Notifications/ })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Notifications' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('.ui-notification-center__panel')).toHaveClass(/ui-drawer/);
    // The lab's sticky toolbar covers the drawer's header, so the close button is pressed from the keyboard.
    await dialog.getByRole('button', { name: 'Close' }).press('Enter');
    await expect(dialog).toHaveCount(0);
  });

  test('UIC-NOTIFICATION-CENTER-1.1 UIC-NOTIFICATION-CENTER-1.3 UIC-NOTIFICATION-CENTER-1.4 UIC-NOTIFICATION-CENTER-1.5 UIC-NOTIFICATION-CENTER-1.6 works through the inbox', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const inbox = page.locator('[data-lab-inbox]');
    const row = (title: string) => inbox.locator('.ui-notification-list__item', { hasText: title });
    const mention = row('Maria Santos mentioned you');
    await expect(mention).toHaveAttribute('data-unread', 'true');
    await expect(mention.locator('.ui-meta-line')).toHaveText(
      'Maria Santos · Requirement 12 · 18 minutes ago',
    );
    await mention.getByRole('button', { name: 'Mark as read' }).click();
    await expect(mention).not.toHaveAttribute('data-unread');
    await expect(inbox.getByRole('radio', { name: 'Unread, 2' })).toBeVisible();
    await row('Jon Berg replied').getByRole('link').click();
    await expect(page).toHaveURL(/#comment$/);
    await expect(row('Jon Berg replied')).not.toHaveAttribute('data-unread');
    await row('Lena Ortiz invited you').getByRole('button', { name: 'Accept' }).click();
    await expect(row('Lena Ortiz invited you')).toHaveCount(0);
    // A row that leaves with focus hands it to a neighbour rather than to the page.
    await expect(inbox.locator('.ui-notification-list__item :focus')).toHaveCount(1);
    await row('Weekly digest').getByRole('button', { name: 'Dismiss' }).click();
    await expect(row('Weekly digest')).toHaveCount(0);
    await expect(inbox.locator('.ui-notification-list__dismiss:focus')).toHaveCount(1);
    await inbox.getByRole('radio', { name: /^Unread/ }).click();
    await expect(inbox).toHaveAttribute('data-filter', 'unread');
    await expect(row('Import of Orchard.csv')).toHaveCount(0);
    await inbox.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(inbox.getByRole('heading', { name: 'Nothing unread' })).toBeVisible();
    await expect(inbox.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });

  test('UIC-NOTIFICATION-CENTER-1.2 UIC-NOTIFICATION-CENTER-1.8 loads the older page as it comes into view', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const inbox = page.locator('[data-lab-inbox]');
    await inbox.locator('.ui-notification-list__load-more').scrollIntoViewIfNeeded();
    await expect(inbox.getByText('Export of Cities.xlsx failed')).toBeVisible();
    await expect(inbox.locator('.ui-notification-list__load-more')).toHaveCount(0);
    await expect(
      inbox
        .locator('.ui-notification-list__group-title')
        .evaluateAll((titles) => titles.map((title) => title.textContent)),
    ).resolves.toEqual([
      'Today',
      'Yesterday',
      'Tuesday, April 14',
      'Friday, April 10',
      'Thursday, April 2',
    ]);
  });

  test('UIC-NOTIFICATION-CENTER-1.7 UIC-NOTIFICATION-CENTER-1.8 loads unread notifications of a later page', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const inbox = page.locator('[data-lab-unread-later]');
    await expect(inbox).toHaveAttribute('data-filter', 'unread');
    await expect(inbox).not.toContainText('Nothing unread');
    await inbox.locator('.ui-notification-list__load-more').scrollIntoViewIfNeeded();
    await expect(inbox.getByText('Export of Cities.xlsx failed')).toBeVisible();
    await expect(inbox.locator('.ui-notification-list__load-more')).toHaveCount(0);
  });

  test('UIC-NOTIFICATION-CENTER-1.5 UIC-NOTIFICATION-CENTER-2.2 keeps the filter when the panel opens again', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const bell = page.locator('[data-lab-live]').getByRole('button', { name: /^Notifications/ });
    await bell.click();
    const dialog = page.getByRole('dialog', { name: 'Notifications' });
    await dialog.getByRole('radio', { name: /^Unread/ }).click();
    await expect(dialog.locator('.ui-notification-list')).toHaveAttribute('data-filter', 'unread');
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await bell.click();
    await expect(dialog.getByRole('radio', { name: /^Unread/ })).toBeChecked();
    await expect(dialog).toContainText('Nothing unread');
  });

  test('UIC-NOTIFICATION-CENTER-1.7 shows the empty and loading states', async ({ page, lab }) => {
    await lab.open('notification-center');
    await expect(matrixCell(page, 'state=loading').locator('.ui-empty-state')).toHaveAttribute(
      'data-variant',
      'loading',
    );
    await expect(matrixCell(page, 'state=empty')).toContainText('No notifications');
    await expect(matrixCell(page, 'state=nothing unread')).toContainText('Nothing unread');
  });

  test('UIC-NOTIFICATION-CENTER-3.1 announces arrivals while closed and open', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const live = page.locator('[data-lab-live]');
    const status = live.locator('.ui-notification-center__announcement');
    // Scrolling down to the live bell passes the inbox, which then loads its older page and shifts
    // the content below it; let it load first so the page holds still under the click.
    const inbox = page.locator('[data-lab-inbox]');
    await inbox.locator('.ui-notification-list__load-more').scrollIntoViewIfNeeded();
    await expect(inbox.locator('.ui-notification-list__load-more')).toHaveCount(0);
    await page.getByRole('button', { name: 'Add a notification' }).click();
    await expect(status).toHaveText('New notification: Build 1 passed');
    await expect(live.getByRole('button', { name: 'Notifications, 1 unread' })).toBeVisible();
    await live.getByRole('button', { name: /^Notifications/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Notifications' });
    await expect(dialog.getByText('Build 1 passed')).toBeVisible();
    // The bell's status is the only one: the list in the panel renders none.
    await expect(dialog.locator('.ui-notification-list__announcement')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add a notification' }).click();
    await expect(status).toHaveText('New notification: Build 2 passed');
  });

  test('UIC-NOTIFICATION-CENTER-3.1 translates an existing arrival without a new notification', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const inbox = page.locator('[data-lab-inbox]');
    await inbox.locator('.ui-notification-list__load-more').scrollIntoViewIfNeeded();
    await expect(inbox.locator('.ui-notification-list__load-more')).toHaveCount(0);
    const demo = page.locator('[data-lab-demo="live-announcements"]');
    await demo.getByRole('button', { name: 'Add a notification' }).click();
    const status = demo.locator('.ui-notification-center__announcement');
    await expect(status).toHaveText('New notification: Build 1 passed');
    await demo.getByRole('radio', { name: 'French' }).click();
    await expect(status).toHaveText('Nouvelle notification : Build 1 passed');
    await demo.getByRole('radio', { name: 'English' }).click();
    await expect(status).toHaveText('New notification: Build 1 passed');
  });

  test('UIC-NOTIFICATION-CENTER-3.2 moves between rows with the arrow keys and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const inbox = page.locator('[data-lab-inbox]');
    await inbox.getByRole('link', { name: /Maria Santos mentioned you/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(inbox.getByRole('button', { name: /Lena Ortiz invited you/ })).toBeFocused();
    await lab.expectAccessible();
  });
});

test.describe('Notification Center host cases', () => {
  test('UIC-NOTIFICATION-CENTER-2.1 UIC-NOTIFICATION-CENTER-2.2 UIC-NOTIFICATION-CENTER-1.5 follows a page that owns the panel and filter', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const demo = page.locator('[data-lab-demo="owned-center"]');
    const bell = demo.locator('.ui-notification-center__trigger');
    const panel = page.locator('.ui-notification-center__panel');
    const output = (name: string) => demo.locator(`[data-lab-output="${name}"]`);
    await expect(demo.locator('.ui-notification-center__count')).toHaveText('9+');
    await demo
      .getByRole('radiogroup', { name: 'Count maximum' })
      .getByRole('radio', { name: '99' })
      .click();
    await expect(demo.locator('.ui-notification-center__count')).toHaveText('12');

    // Room above and below the bell, so the panel takes the placement asked rather than flipping.
    await bell.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await demo.getByRole('button', { name: 'Open from the page' }).click();
    await expect(panel).toBeVisible();
    await expect(output('open')).toHaveText('open');
    const bellBox = requireDefined(await bell.boundingBox());
    const below = requireDefined(await panel.boundingBox());
    expect(Math.round(below.x)).toBe(Math.round(bellBox.x));
    expect(below.y).toBeGreaterThan(bellBox.y + bellBox.height);

    await panel.getByRole('radio', { name: 'Unread' }).click();
    await expect(output('filter')).toHaveText('unread, loading');
    await expect(output('filter')).toHaveText('unread');
    await expect(panel.getByText('Import of Orchard.csv finished')).toHaveCount(0);
    await expect(output('requests')).toHaveText('unread');
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
    await expect(output('open')).toHaveText('closed');

    await demo
      .getByRole('radiogroup', { name: 'Placement' })
      .getByRole('radio', { name: 'top' })
      .click();
    await bell.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    await bell.click();
    await expect(panel).toBeVisible();
    const top = requireDefined(await bell.boundingBox());
    const above = requireDefined(await panel.boundingBox());
    expect(above.y + above.height).toBeLessThan(top.y);
    await expect(panel.getByRole('radio', { name: 'Unread' })).toBeChecked();
    await page.keyboard.press('Escape');

    await demo
      .getByRole('radiogroup', { name: 'Presentation' })
      .getByRole('radio', { name: 'drawer' })
      .click();
    await demo.getByRole('button', { name: 'Open from the page' }).click();
    await expect(page.getByRole('dialog', { name: 'Notifications' })).toBeVisible();
    await expect(page.locator('.ui-drawer.ui-notification-center__panel')).toBeVisible();
  });

  test('UIC-NOTIFICATION-CENTER-2.1 opens a bell as it mounts with defaultOpen', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const demo = page.locator('[data-lab-demo="center-open-on-mount"]');
    await expect(page.getByRole('dialog', { name: 'Kitchen alerts' })).toHaveCount(0);
    await demo.getByRole('button', { name: 'Mount a bell open' }).click();
    const panel = page.getByRole('dialog', { name: 'Kitchen alerts' });
    await expect(panel).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  });
});

test.describe('Notification list quiet arrivals and time policy', () => {
  test.use({ timezoneId: 'Asia/Tokyo' });

  test('UIC-NOTIFICATION-CENTER-3.1 UIC-NOTIFICATION-CENTER-1.2 leaves arrivals to the page and reads times in the chosen zone', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const demo = page.locator('[data-lab-demo="quiet-list"]');
    const list = demo.locator('.ui-notification-list');
    const headings = list.locator('.ui-notification-list__group-title');
    const proofing = list.locator('.ui-notification-list__item', { hasText: 'Proofing finished' });
    await expect(headings).toHaveText(['Yesterday', 'Friday, April 17']);
    await expect(proofing).toContainText('Yesterday');

    await demo.getByRole('button', { name: 'Add an arrival' }).click();
    await expect(demo.locator('[data-lab-output="arrivals"]')).toHaveText('1');
    await expect(demo.locator('[data-lab-host-announcement]')).toHaveText(
      'New in the kitchen: Batch 2 ready',
    );
    await expect(list.locator('.ui-notification-list__announcement')).toHaveCount(0);
    await expect(demo.getByRole('status').filter({ hasText: 'Batch 2 ready' })).toHaveCount(1);

    await demo
      .getByRole('radiogroup', { name: 'Provider time zone' })
      .getByRole('radio', { name: 'London' })
      .click();
    await expect(headings).toHaveText(['Today', 'Sunday, April 19', 'Friday, April 17']);
    await expect(proofing).toContainText('2 days ago');
    await demo
      .getByRole('radiogroup', { name: 'Dates after (days)' })
      .getByRole('radio', { name: '1' })
      .click();
    await expect(proofing).toContainText(/Apr 19, 2026, 11:00\sPM/);
    await lab.expectAccessible('[data-lab-demo="quiet-list"]');
  });
});
