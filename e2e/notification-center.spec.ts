import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-notification-center`;

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

  test('UIC-NOTIFICATION-CENTER-1.7 shows the empty and loading states', async ({ page, lab }) => {
    await lab.open('notification-center');
    await expect(page.locator('[data-lab-cell="state=loading"] .ui-empty-state')).toHaveAttribute(
      'data-variant',
      'loading',
    );
    await expect(page.locator('[data-lab-cell="state=empty"]')).toContainText('No notifications');
    await expect(page.locator('[data-lab-cell="state=nothing unread"]')).toContainText(
      'Nothing unread',
    );
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
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Add a notification' }).click();
    await expect(status).toHaveText('New notification: Build 2 passed');
  });

  test('UIC-NOTIFICATION-CENTER-3.2 moves between rows with the arrow keys and passes axe in both themes', async ({
    page,
    lab,
  }) => {
    await lab.open('notification-center');
    const inbox = page.locator('[data-lab-inbox]');
    await inbox.getByRole('link', { name: /Maria Santos mentioned you/ }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(inbox.getByRole('button', { name: /Lena Ortiz invited you/ })).toBeFocused();
    await lab.expectAccessible();
    await lab.open('notification-center', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
