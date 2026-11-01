import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element not rendered');
  return box;
}

test.describe('Hover Card lab', () => {
  test('UIC-HOVER-CARD-1.1 UIC-BUTTON-1.6 opens from a trigger with a hint of its own, by hover and by keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card');
    const demo = page.locator('[data-lab-demo="hinted-trigger"]');
    const trigger = demo.getByRole('button', { name: 'Kyoto' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await page.mouse.move(0, 0);
    await trigger.hover();
    const card = page.getByRole('dialog', { name: 'About Kyoto' });
    await expect(card).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    // Keyboard focus too opens the card, and Tab reaches the card's Save button.
    await page.mouse.move(0, 0);
    await expect(card).toHaveCount(0);
    await trigger.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(trigger).toBeFocused();
    await expect(card).toBeVisible();
    await page.keyboard.press('Tab');
    const save = card.getByRole('button', { name: 'Save Kyoto' });
    await expect(save).toBeFocused();
    await expect(card).toBeVisible();
    // The Save button's own tooltip opens inside the card, which stays open.
    await expect(page.getByRole('tooltip')).toHaveText('Keep it in your list');
    await expect(card).toBeVisible();
    await save.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Keep it in your list');
    await expect(card).toBeVisible();
  });

  test('UIC-HOVER-CARD-1.2 UIC-HOVER-CARD-1.3 UIC-HOVER-CARD-2.2 opens on hover after the delay and stays open on the way in', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const trigger = page.locator('[data-lab-trigger="bottom-arrow"]');
    const card = page.locator('.ui-hover-card[data-lab-card="bottom-arrow"]');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    // React Aria opens previews for a pointer it has already seen move.
    await page.mouse.move(5, 300);
    await trigger.hover();
    await page.clock.runFor(599);
    await expect(card).toHaveCount(0);
    await page.clock.runFor(1);
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('role', 'dialog');
    await expect(card).toHaveAccessibleName('About Lisbon');
    await expect(card).toHaveAttribute('data-trigger', 'PreviewTrigger');
    await expect(card).toHaveAttribute('data-placement', 'bottom');
    await expect(card).toHaveCSS('z-index', '130');
    await expect(card.locator('.ui-hover-card__arrow')).toHaveAttribute('data-placement', 'bottom');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(card.locator(':focus')).toHaveCount(0);
    const [cardBox, triggerBox] = await Promise.all([boxOf(card), boxOf(trigger)]);
    expect(cardBox.y).toBeGreaterThanOrEqual(triggerBox.y + triggerBox.height);

    await page.mouse.move(cardBox.x + 20, cardBox.y + 20, { steps: 8 });
    await page.clock.runFor(1000);
    await expect(card).toBeVisible();
    await page.mouse.move(5, 300);
    await page.clock.runFor(199);
    await expect(card).toBeVisible();
    await page.clock.runFor(800);
    await expect(card).toHaveCount(0);
    await page.clock.resume();
  });

  test('UIC-HOVER-CARD-1.1 UIC-HOVER-CARD-1.3 opens on keyboard focus, lets Tab in and returns focus on Escape', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const link = page.locator('[data-lab-link="Oslo"]');
    const card = page.getByRole('dialog', { name: 'About Oslo' });
    await page.locator('[data-lab-link="Lisbon"]').focus();
    await page.clock.runFor(100);
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await page.clock.runFor(600);
    await expect(card).toBeVisible();
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute('aria-describedby', (await card.getAttribute('id')) ?? '');
    await page.keyboard.press('Tab');
    const save = card.getByRole('button', { name: 'Save Oslo' });
    await expect(save).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-output="saved"]')).toHaveText('Oslo');
    await page.keyboard.press('Escape');
    await page.clock.runFor(1000);
    await expect(card).toHaveCount(0);
    // Focus returns in an animation frame once the card has gone.
    await page.clock.runFor(100);
    await expect(link).toBeFocused();
    await page.clock.resume();
    await page.clock.runFor(600);
    await lab.expectAccessible();
  });

  test('UIC-HOVER-CARD-1.2 opens the next card at once right after one closes', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    await page.mouse.move(5, 300);
    await page.locator('[data-lab-link="Lisbon"]').hover();
    await page.clock.runFor(600);
    await expect(page.getByRole('dialog', { name: 'About Lisbon' })).toBeVisible();
    await page.locator('[data-lab-link="Kyoto"]').hover();
    await page.clock.runFor(10);
    await expect(page.getByRole('dialog', { name: 'About Kyoto' })).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'About Lisbon' })).toHaveCount(0);
    // axe runs on timers, so let the clock go; the pointer keeps the card open.
    await page.clock.resume();
    await lab.expectAccessible('.ui-hover-card');
  });

  test('UIC-HOVER-CARD-1.4 follows a controlled state and stays closed while disabled', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('hover-card');
    await page.clock.pauseAt(Date.now() + 1000);
    const output = page.locator('[data-lab-output="controlled"]');
    const card = page.locator('.ui-hover-card[data-lab-card="controlled"]');
    await page.locator('[data-lab-toggle]').click();
    await expect(card).toBeVisible();
    await expect(output).toHaveText('open');
    await page.locator('[data-lab-toggle]').click();
    await page.clock.runFor(500);
    await expect(card).toHaveCount(0);
    await expect(output).toHaveText('closed');

    await page.locator('[data-lab-trigger="disabled"]').hover();
    await page.clock.runFor(2000);
    await expect(page.locator('.ui-hover-card[data-lab-card="disabled"]')).toHaveCount(0);

    // Locking an open card closes it once; it stays closed when unlocked.
    await page.locator('[data-lab-toggle]').click();
    await expect(card).toBeVisible();
    await page.locator('[data-lab-lock]').click();
    await page.clock.runFor(500);
    await expect(card).toHaveCount(0);
    await expect(output).toHaveText('closed');
    await page.locator('[data-lab-lock]').click();
    await page.clock.runFor(500);
    await expect(card).toHaveCount(0);
    await page.clock.resume();
  });

  test('UIC-HOVER-CARD-2.1 passes axe with an open card in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('hover-card', { theme: 'dark' });
    await page.mouse.move(5, 300);
    await page.locator('[data-lab-trigger="end-arrow"]').hover();
    const card = page.locator('.ui-hover-card[data-lab-card="end-arrow"]');
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute('data-placement', 'right');
    await lab.expectAccessible('.ui-hover-card');
    await lab.expectAccessible();
  });
});
