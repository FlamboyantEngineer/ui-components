import { expect, test } from './fixtures.js';

test.describe('Action Button lab', () => {
  test('UIC-ACTION-BUTTON-1.1 UIC-ACTION-BUTTON-1.2 runs once per press until it settles', async ({
    page,
    lab,
  }) => {
    await lab.open('action-button');
    const save = page.locator('[data-lab-action="save"]');
    await save.click();
    await expect(save).toHaveAttribute('data-pending', 'true');
    await save.click({ force: true });
    await save.press('Enter');
    await page.locator('[data-lab-action="finish"]').click();
    await expect(save).not.toHaveAttribute('data-pending', 'true');
    await expect(page.locator('[data-lab-output="runs"]')).toHaveText('1');
    await lab.expectAccessible();
  });

  test('UIC-ACTION-BUTTON-1.3 returns to idle after a rejection and reports it', async ({
    page,
    lab,
  }) => {
    await lab.open('action-button');
    const upload = page.locator('[data-lab-action="fail"]');
    await upload.click();
    await expect(upload).toHaveAttribute('data-pending', 'true');
    await page.locator('[data-lab-action="reject"]').click();
    await expect(upload).not.toHaveAttribute('data-pending', 'true');
    await expect(page.locator('[data-lab-output="error"]')).toHaveText('Error: The request failed');
  });

  test('UIC-ACTION-BUTTON-1.6 keeps its hint and shortcut while pending', async ({ page, lab }) => {
    await lab.open('action-button');
    const pending = page.locator('[data-lab-cell="state=pending size=md"] .ui-button', {
      hasText: 'Publish',
    });
    await expect(pending).toHaveAttribute('data-pending', 'true');
    await expect(pending).toHaveAttribute('aria-keyshortcuts', 'Control+Enter');
    // React Aria opens a tooltip on keyboard focus, so arrive with Tab. The whole sequence retries,
    // because a late focus change on a busy machine closes the tooltip between the checks.
    await expect(async () => {
      await page
        .locator('[data-lab-cell="state=pending size=sm"] .ui-button', { hasText: 'Publish' })
        .focus();
      await page.keyboard.press('Tab');
      await expect(pending).toBeFocused({ timeout: 2000 });
      await expect(
        page.getByRole('tooltip', { name: 'Publish the draft Control Enter' }),
      ).toBeVisible({ timeout: 2000 });
      await expect(pending).toHaveAccessibleDescription('Publish the draft Control Enter', {
        timeout: 2000,
      });
    }).toPass({ timeout: 20000 });
    await lab.expectAccessible();
  });

  test('UIC-ACTION-BUTTON-1.7 shows the pending state only once the delay has passed', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('action-button');
    await page.clock.pauseAt(Date.now() + 1000);
    const publish = page.locator('[data-lab-action="delayed"]');
    await publish.focus();
    await page.keyboard.press('Enter');
    await expect(publish).not.toHaveAttribute('data-pending');
    await page.clock.runFor(999);
    await expect(publish).not.toHaveAttribute('data-pending');
    await page.clock.runFor(1);
    await expect(publish).toHaveAttribute('data-pending', 'true');
    await page.locator('[data-lab-action="release"]').click();
    await expect(publish).not.toHaveAttribute('data-pending');
    await page.clock.resume();
  });
});
