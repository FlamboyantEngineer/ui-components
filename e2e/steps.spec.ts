import { expect, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-steps`;

test.describe('Steps lab', () => {
  test('UIC-STEPS-1.1 UIC-STEPS-1.2 UIC-STEPS-1.3 lists the steps with their statuses', async ({
    page,
    lab,
  }) => {
    await lab.open('steps');
    const list = page.locator(cell('density=default orientation=horizontal'));
    await expect(list).toHaveJSProperty('tagName', 'OL');
    const items = list.locator('.ui-steps__item');
    await expect(items).toHaveCount(4);
    await expect(items.nth(0)).toHaveAttribute('data-status', 'complete');
    await expect(items.nth(1)).toHaveAttribute('data-status', 'current');
    await expect(items.nth(1)).toHaveAttribute('aria-current', 'step');
    await expect(items.nth(2)).toHaveAttribute('data-status', 'upcoming');
    await expect(list.locator('.ui-steps__connector')).toHaveCount(3);
    for (const status of ['complete', 'current', 'upcoming', 'error', 'skipped']) {
      await expect(page.locator(`${cell(`status=${status}`)} .ui-steps__item`)).toHaveAttribute(
        'data-status',
        status,
      );
    }
  });

  test('UIC-STEPS-1.5 UIC-STEPS-1.6 lays the steps out by orientation and density', async ({
    page,
    lab,
  }) => {
    await lab.open('steps');
    const horizontal = page.locator(cell('density=default orientation=horizontal'));
    const vertical = page.locator(cell('density=default orientation=vertical'));
    const box = async (list: typeof horizontal, index: number) =>
      requireDefined(await list.locator('.ui-steps__marker').nth(index).boundingBox());
    expect((await box(horizontal, 1)).x).toBeGreaterThan((await box(horizontal, 0)).x);
    expect(Math.round((await box(horizontal, 1)).y)).toBe(Math.round((await box(horizontal, 0)).y));
    expect((await box(vertical, 1)).y).toBeGreaterThan((await box(vertical, 0)).y);
    expect(Math.round((await box(vertical, 1)).x)).toBe(Math.round((await box(vertical, 0)).x));
    await expect(horizontal.locator('.ui-steps__description').first()).toHaveText(
      'Choose a spreadsheet',
    );
    await expect(horizontal.locator('.ui-steps__optional')).toHaveText('Optional');
    const compact = page.locator(cell('density=compact orientation=horizontal'));
    await expect(compact).toHaveAttribute('data-density', 'compact');
    await expect(compact.locator('.ui-steps__description')).toHaveCount(0);
    await expect(compact.getByText('Map columns', { exact: true })).toBeVisible();
    const hiddenLabel = compact.locator('.ui-steps__label').first().locator('..');
    expect(await hiddenLabel.boundingBox()).toMatchObject({
      width: 1,
      height: 1,
    });
  });

  test('UIC-STEPS-2.1 UIC-STEPS-2.3 UIC-STEPS-3.2 returns to settled steps by pointer and keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('steps');
    const demo = page.locator('[data-lab-demo="import"]');
    const list = demo.getByRole('list', { name: 'Import' });
    await expect(list.getByRole('button')).toHaveCount(1);
    const upload = list.getByRole('button', { name: 'Upload Completed Choose a spreadsheet' });
    await demo.getByRole('button', { name: 'Next' }).click();
    await demo.getByRole('button', { name: 'Next' }).click();
    await expect(demo.locator('[data-lab-current]')).toHaveText('Current step: import');
    await expect(list.getByRole('button')).toHaveCount(3);
    await upload.hover();
    await expect(upload).toHaveAttribute('data-hovered', 'true');
    await upload.click();
    await expect(demo.locator('[data-lab-current]')).toHaveText('Current step: upload');
    await expect(list.getByRole('button')).toHaveCount(0);
    await demo.getByRole('button', { name: 'Next' }).click();
    await demo.getByRole('button', { name: 'Next' }).click();
    await upload.focus();
    await page.keyboard.press('Tab');
    const map = list.getByRole('button', { name: 'Map columns Completed Match columns to fields' });
    await expect(map).toBeFocused();
    await expect(map).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-current]')).toHaveText('Current step: map');
  });

  test('UIC-STEPS-3.1 names each list and passes axe in both themes', async ({ page, lab }) => {
    await lab.open('steps');
    await expect(page.getByRole('list', { name: 'Steps' }).first()).toBeVisible();
    await expect(page.getByRole('list', { name: 'Step error' })).toContainText('Has errors');
    await lab.expectAccessible();
    await lab.open('steps', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
