import { expect, test } from './fixtures.js';

test.describe('Tour lab', () => {
  test('UIC-TOUR-1.1 UIC-TOUR-1.3 UIC-TOUR-2.1 walks the page with a spotlight over each target', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    await page.locator('[data-lab-start="page"]').click();
    const step = page.getByRole('dialog', { name: 'Search' });
    await expect(step).toContainText('1 of 5');
    const spotlight = page.locator('.ui-tour__spotlight');
    const target = page.locator('[data-lab-page="guided"] [data-lab-target="search"]');
    await expect(async () => {
      const [spot, box] = [await spotlight.boundingBox(), await target.boundingBox()];
      expect(spot).toEqual(box);
    }).toPass();
    // The panel opens below its target.
    const panel = page.locator('[data-lab-tour="page"]');
    await expect(panel).toHaveAttribute('data-placement', 'bottom');
    expect((await panel.boundingBox())?.y).toBeGreaterThan((await target.boundingBox())?.y ?? 0);

    await step.getByRole('button', { name: 'Next' }).click();
    const filters = page.getByRole('dialog', { name: 'Filters' });
    await expect(filters).toContainText('2 of 5');
    await expect(page.locator('[data-lab-output="step"]')).toHaveText('2');
    const filtersTarget = page.locator('[data-lab-page="guided"] [data-lab-target="filters"]');
    await expect(async () => {
      expect(await spotlight.boundingBox()).toEqual(await filtersTarget.boundingBox());
    }).toPass();
    await filters.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('UIC-TOUR-1.2 UIC-TOUR-2.5 finishes on a centred step and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const start = page.locator('[data-lab-start="page"]');
    await start.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeFocused();
    for (const title of ['Filters', 'Your recipes', 'Share', 'All set']) {
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('dialog', { name: title })).toBeFocused();
    }
    await expect(page.locator('.ui-tour__spotlight')).toHaveAttribute(
      'data-target-missing',
      'true',
    );
    await expect(page.locator('.ui-tour__arrow')).toHaveCount(0);
    const last = page.getByRole('dialog', { name: 'All set' });
    await expect(last.getByRole('button', { name: 'Skip' })).toHaveCount(0);
    await last.getByRole('button', { name: 'Finish' }).click();
    await expect(last).toHaveCount(0);
    await expect(page.locator('.ui-tour__spotlight')).toHaveCount(0);
    await expect(page.locator('[data-lab-output="outcome"]')).toHaveText('finished');
    await expect(start).toBeFocused();
  });

  test('UIC-TOUR-2.2 UIC-TOUR-3.2 skips with Escape and keeps a modal page inert', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    await page.getByRole('button', { name: 'Tour bottom' }).first().click();
    const modal = page.getByRole('dialog', { name: 'This button' });
    await expect(modal).toBeFocused();
    await expect(page.locator('[data-lab-tour="bottom-modal"]')).not.toHaveAttribute(
      'data-non-modal',
    );
    // Outside the tour, the page is inert.
    const outside = page.locator('[data-lab-start="page"]');
    await expect
      .poll(() => outside.evaluate((element) => element.closest('[inert]') !== null))
      .toBe(true);
    await page.mouse.click(5, 5);
    await expect(modal).toBeVisible();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(modal.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tour bottom' }).first()).toBeFocused();

    await page.getByRole('button', { name: 'Tour end' }).last().click();
    const nonModal = page.locator('[data-lab-tour="end-non-modal"]');
    await expect(nonModal).toHaveAttribute('data-non-modal', 'true');
    await expect
      .poll(() => outside.evaluate((element) => element.closest('[inert]') !== null))
      .toBe(false);
    await expect(page.getByRole('button', { name: 'Take the tour' })).toBeVisible();
    await page.getByRole('button', { name: 'Take the tour' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('UIC-TOUR-2.3 UIC-TOUR-3.1 remembers completion through the provider storage', async ({
    page,
    lab,
  }) => {
    await lab.open('tour');
    const completed = page.locator('[data-lab-output="remembered"]');
    await expect(completed).toHaveText('no');
    await page.getByRole('button', { name: 'Reload' }).click();
    const step = page.getByRole('dialog', { name: 'Search' });
    await expect(step).toBeVisible();
    await step.getByRole('button', { name: 'Skip' }).click();
    await expect(step).toHaveCount(0);
    await expect(completed).toHaveText('yes');
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Forget completion' }).click();
    await expect(completed).toHaveText('no');
    await page.getByRole('button', { name: 'Reload' }).click();
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('UIC-TOUR-1.1 passes axe with a step open', async ({ page, lab }) => {
    await lab.open('tour');
    await page.locator('[data-lab-start="page"]').click();
    const panel = page.locator('[data-lab-tour="page"]');
    await expect(panel).toBeVisible();
    await expect(panel).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('[data-lab-tour="page"]');
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
    await lab.open('tour', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
