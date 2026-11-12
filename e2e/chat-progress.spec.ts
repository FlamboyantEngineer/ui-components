import type { Page } from '@playwright/test';
import { expect, formatLabUrl, test, waitForLab } from './fixtures.js';

const demo = (page: Page) => page.locator('[data-lab-section="Slow host"]');
const composer = (page: Page) => demo(page).getByRole('textbox', { name: 'Message' });
const line = (page: Page) => demo(page).locator('.ui-chat__progress');

/** Opens the Chat lab with the fake agent pausing `pause` milliseconds between chunks. */
async function openSlowHost(page: Page, pause = 60) {
  await page.goto(`${formatLabUrl('chat')}&pause=${pause}`);
  await waitForLab(page);
  await demo(page).scrollIntoViewIfNeeded();
}

/** Picks one of the slow host lab's choices by its label. */
async function choose(page: Page, label: string) {
  await demo(page).locator('label', { hasText: label }).click();
  await expect(demo(page).getByRole('radio', { name: label })).toBeChecked();
}

test.describe('Chat progress', () => {
  test('UIC-CHAT-3.13 UIC-MESSAGE-COMPOSER-3.9 shows a slow send in the line and the send button, then clears', async ({
    page,
  }) => {
    await openSlowHost(page);
    await expect(line(page)).toBeEmpty();
    await expect(line(page)).toBeHidden();
    await composer(page).click();
    await page.keyboard.type('Plan a picnic');
    await page.keyboard.press('Enter');
    await expect(line(page)).toHaveText('Sending…');
    await expect(line(page)).toHaveAttribute('data-action', 'send');
    await expect(line(page).locator('[data-glyph="clock"]')).toBeVisible();
    await expect(demo(page).locator('.ui-message-composer__action')).toHaveAttribute(
      'data-pending',
      'true',
    );
    await expect(demo(page).locator('article', { hasText: 'Plan a picnic' })).toBeVisible();
    await expect(line(page)).toBeEmpty();
  });

  test('UIC-CHAT-3.13 shows nothing for a host that answers within 400 ms, and the spinner on request', async ({
    page,
  }) => {
    await openSlowHost(page);
    await choose(page, 'In 250 ms');
    await composer(page).click();
    await page.keyboard.type('Quick one');
    await page.keyboard.press('Enter');
    await expect(demo(page).locator('article', { hasText: 'Quick one' })).toBeVisible();
    // The host answered before the delay, so the line never showed.
    await expect(line(page)).toBeEmpty();
    await choose(page, 'In 6 s');
    await choose(page, 'Spinner');
    await composer(page).click();
    await page.keyboard.type('Slow one');
    await page.keyboard.press('Enter');
    await expect(line(page).locator('.ui-spinner')).toBeVisible();
    // The first reply may still run, so the message is sent or queued.
    await expect(line(page)).toHaveText(/^(Sending|Queuing)…$/);
  });

  test('UIC-CHAT-3.13 UIC-CHAT-3.4 reads Queuing while a reply runs and Steering for a slow steer', async ({
    page,
  }) => {
    await openSlowHost(page, 120);
    await composer(page).click();
    await page.keyboard.type('Plan a picnic');
    await page.keyboard.press('Enter');
    await expect(demo(page).locator('article[data-status="streaming"]')).toHaveCount(1);
    await page.keyboard.type('And a park');
    await page.keyboard.press('Enter');
    await expect(line(page)).toHaveText('Queuing…');
    const queue = demo(page).getByRole('list', { name: '1 queued message' });
    await expect(queue).toContainText('And a park');
    await expect(line(page)).toBeEmpty();
    await demo(page).getByRole('button', { name: 'Steer with queued message 1' }).click();
    await expect(demo(page).locator('.ui-chat__queue-item[data-steering]')).toHaveCount(1);
    await expect(line(page)).toHaveText('Steering…');
    await expect(demo(page).locator('.ui-chat__queue')).toHaveCount(0);
    await expect(line(page)).toBeEmpty();
  });

  test('UIC-CHAT-3.14 steers from the "+" menu option and keeps it after a reload', async ({
    page,
  }) => {
    await openSlowHost(page, 120);
    await choose(page, 'At once');
    await demo(page).getByRole('button', { name: 'Add and more' }).click();
    const steer = page.getByRole('menuitemcheckbox', { name: /^Steer automatically/ });
    await steer.click();
    await expect(steer).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await composer(page).click();
    await page.keyboard.type('Plan a picnic');
    await page.keyboard.press('Enter');
    await expect(demo(page).locator('article[data-status="streaming"]')).toHaveCount(1);
    await page.keyboard.type('Make it a beach');
    await page.keyboard.press('Enter');
    await expect(demo(page).locator('article[data-status="cancelled"]')).toHaveCount(1);
    await expect(demo(page).locator('.ui-chat__queue')).toHaveCount(0);
    await page.reload();
    await waitForLab(page);
    await demo(page).getByRole('button', { name: 'Add and more' }).click();
    await expect(
      page.getByRole('menuitemcheckbox', { name: /^Steer automatically/ }),
    ).toHaveAttribute('aria-checked', 'true');
  });
});
