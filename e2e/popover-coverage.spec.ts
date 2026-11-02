import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const demo = (page: Page, name: string) => page.locator(`[data-lab-demo="${name}"]`);

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('not rendered');
  return box;
}

/** Scrolls the trigger just below the lab's sticky header, near the top of the window. */
async function toTop(trigger: Locator) {
  await trigger.evaluate((element) => {
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    element.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -(header + 8));
  });
}

test.describe('Popover lab coverage', () => {
  test('UIC-POPOVER-1.3 flips near the top of the window and keeps its container padding', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    const area = demo(page, 'popover-geometry');
    const trigger = area.getByRole('button', { name: 'Crate details' });
    const popover = page.locator('[data-lab-popover="tuned"]');
    await page.evaluate(() => (document.body.style.paddingBottom = '100vh'));
    await toTop(trigger);
    await trigger.click();
    await expect(popover).toHaveAttribute('data-placement', 'bottom');
    await page.keyboard.press('Escape');

    await area.getByText('Flip when it does not fit').click();
    await toTop(trigger);
    await trigger.click();
    await expect(popover).toHaveAttribute('data-placement', 'top');
    await expect.poll(async () => Math.round((await boxOf(popover)).y)).toBe(24);
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);

    const padding = area.getByRole('textbox', { name: 'Container padding' });
    await padding.fill('8');
    await padding.press('Enter');
    await expect(page.locator('[data-lab-output="position"]')).toContainText('containerPadding 8');
    await padding.blur();
    await toTop(trigger);
    await trigger.click();
    await expect(popover).toHaveAttribute('data-placement', 'top');
    await expect.poll(async () => Math.round((await boxOf(popover)).y)).toBe(8);
  });

  test('UIC-POPOVER-1.1 a trigger with defaultOpen opens its popover when it mounts', async ({
    page,
    lab,
  }) => {
    await lab.open('popover');
    const area = demo(page, 'popover-default-open');
    await area.getByRole('button', { name: 'Add the tip' }).click();
    const popover = page.locator('[data-lab-popover="default-open"]');
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toHaveCount(0);
    await expect(page.locator('[data-lab-output="Tip changes"]')).toHaveText('closed');
  });
});
