import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('User Card Trigger lab timings, defaults, plain buttons and commands', () => {
  test('UIC-USER-CARD-TRIGGER-1.3 opens and closes after the chosen delays', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card-trigger');
    const demo = page.locator('[data-lab-demo="timed-hover"]');
    await demo.getByRole('button', { name: 'Open after 0 ms' }).click();
    await demo.getByRole('button', { name: 'Close after 1200 ms' }).click();
    await expect(output(page, 'Timings')).toHaveText('delay 0 ms, closeDelay 1200 ms');
    await demo.getByRole('button', { name: 'Ada Moreau' }).hover();
    const card = page.getByRole('dialog', { name: 'Ada Moreau' });
    await expect(card).toBeVisible();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await expect(card).toBeVisible();
    await expect(card).toBeHidden();
    await expect(output(page, 'Timed card')).toHaveText('open, closed');
  });

  test('UIC-USER-CARD-TRIGGER-1.4 opens a card on its first render', async ({ page, lab }) => {
    await lab.open('user-card-trigger');
    await page.getByRole('button', { name: 'Mount a card open at first' }).click();
    const card = page.getByRole('dialog', { name: 'Noor Haddad' });
    await expect(card).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(card).toBeHidden();
    await expect(output(page, 'Open at first')).toHaveText('closed');
  });

  test('UIC-USER-CARD-TRIGGER-1.5 keeps one focused button as its card comes and goes', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card-trigger');
    const demo = page.locator('[data-lab-demo="late-card"]');
    const trigger = demo.getByRole('button', { name: 'Rui Costa' });
    await trigger.click();
    await expect(output(page, 'Late presses')).toHaveText('press without card');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Attach the card in 2 s' }).click();
    await trigger.focus();
    await expect(output(page, 'Card attached')).toHaveText('true');
    await expect(trigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Rui Costa' })).toBeVisible();
  });

  test('UIC-USER-CARD-TRIGGER-1.3 runs its command on press and closes when locked', async ({
    page,
    lab,
  }) => {
    await lab.open('user-card-trigger');
    const demo = page.locator('[data-lab-demo="hover-command"]');
    const trigger = demo.getByRole('button', { name: 'Elif Kaya' });
    const card = page.getByRole('dialog', { name: 'Elif Kaya' });
    await trigger.hover();
    await expect(card).toBeVisible();
    await trigger.click();
    await expect(output(page, 'Hover presses')).toHaveText('open profile');
    await expect(card).not.toHaveAttribute('aria-modal', 'true');

    await page.mouse.move(0, 0);
    await expect(card).toBeHidden();
    await demo.getByRole('button', { name: 'Disable the trigger in 2 s' }).click();
    await trigger.hover();
    await expect(card).toBeVisible();
    await expect(card).toBeHidden({ timeout: 5000 });
    await expect(output(page, 'Hover card')).toHaveText(/closed$/);
    await demo.getByRole('button', { name: 'Enable the trigger' }).click();
    await expect(card).toBeHidden();
  });
});
