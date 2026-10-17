import { expect, test } from './fixtures.js';

test.describe('Projection lab', () => {
  test('UIC-PROJECTION-1.1 UIC-PROJECTION-1.3 UIC-PROJECTION-1.4 renders the latest declaration or the fallback', async ({
    page,
    lab,
  }) => {
    await lab.open('projection');
    const outlet = (declarations: string, fallback: string) =>
      page.locator(
        `[data-lab-cell="declarations=${declarations} fallback=${fallback}"] [data-lab-outlet]`,
      );
    const origin = (declarations: string, fallback: string) =>
      page.locator(
        `[data-lab-cell="declarations=${declarations} fallback=${fallback}"] [data-lab-origin]`,
      );
    await expect(outlet('none', 'without fallback')).toHaveText('Toolbar:');
    await expect(outlet('none', 'with fallback')).toHaveText('Toolbar: No tools');
    await expect(outlet('one', 'with fallback')).toHaveText('Toolbar: Crop');
    await expect(outlet('two', 'without fallback')).toHaveText('Toolbar: Rotate');
    await expect(origin('two', 'without fallback')).toBeEmpty();
    await lab.expectAccessible();
  });

  test('UIC-PROJECTION-1.2 keeps the declaring page state and works from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('projection');
    const toolbar = page.locator('[data-lab-toolbar]');
    await toolbar.getByRole('button', { name: 'Zoom in (1)' }).click();
    await expect(page.locator('[data-lab-zoom]')).toHaveText('Zoom level 2');

    await page.getByRole('button', { name: 'Zoom in (2)' }).focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-lab-zoom]')).toHaveText('Zoom level 3');
    await expect(toolbar.getByRole('button', { name: 'Zoom in (3)' })).toBeFocused();

    await page.getByRole('button', { name: 'Photos' }).click();
    await expect(toolbar.getByRole('button')).toHaveText('Next photo');
    await page.getByRole('button', { name: 'No page' }).click();
    await expect(toolbar).toHaveText('Page tools: Choose a page');
  });

  test('UIC-PROJECTION-1.4 stacks overlay tools on top and restores the page tools', async ({
    page,
    lab,
  }) => {
    await lab.open('projection');
    const toolbar = page.locator('[data-lab-toolbar]');
    await toolbar.getByRole('button', { name: 'Zoom in (1)' }).click();
    await page.getByRole('checkbox', { name: 'Show overlay tools' }).check();
    await expect(toolbar.getByRole('button')).toHaveText('Close overlay');
    await toolbar.getByRole('button', { name: 'Close overlay' }).click();
    await expect(toolbar.getByRole('button')).toHaveText('Zoom in (2)');
  });
});
