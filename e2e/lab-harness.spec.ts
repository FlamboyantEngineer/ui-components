import type { Page } from '@playwright/test';
import { expect, labUrl, test, waitForLab } from './fixtures.js';

const CUSTOM_SHEET = 'data:text/css,html%7Bbackground-color%3Argb(1%2C%202%2C%203)%7D';

async function background(page: Page) {
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
}

test.describe('lab harness', () => {
  test('UIC-LABS-2.1 UIC-LABS-3.1 renders a lab unstyled, with the reference sheet and with a custom URL', async ({
    page,
    lab,
  }) => {
    await lab.open('provider', { stylesheet: 'none' });
    await expect(page.locator('#ui-lab-stylesheet')).toHaveCount(0);
    await expect(page.locator('[data-lab-cell="glyph=close source=default"] svg')).toBeVisible();
    const unstyled = await background(page);

    await lab.open('provider', { stylesheet: 'reference' });
    await expect(page.locator('#ui-lab-stylesheet')).toHaveAttribute('href', 'reference.css');
    expect(await background(page)).toBe('rgb(255, 255, 255)');
    const glyph = page.locator('[data-lab-cell="glyph=close source=default"] .ui-glyph');
    expect((await glyph.boundingBox())?.width).toBeLessThan(40);

    await lab.open('provider', { stylesheet: CUSTOM_SHEET });
    expect(await background(page)).toBe('rgb(1, 2, 3)');
    expect(unstyled).not.toBe('rgb(1, 2, 3)');
  });

  test('UIC-LABS-2.2 UIC-LABS-2.3 preselects the stylesheet and theme from the query string', async ({
    page,
    lab,
  }) => {
    await lab.open('provider', { stylesheet: 'reference', theme: 'dark' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await background(page)).toBe('rgb(13, 17, 23)');
    const chrome = page.locator('#lab-chrome');
    await expect(chrome.getByLabel('Stylesheet', { exact: true })).toHaveValue('reference');
    await expect(chrome.getByLabel('Theme')).toHaveValue('dark');

    await lab.open('provider', { stylesheet: 'none', theme: 'night', themeAttribute: 'data-mode' });
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'night');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
    await expect(chrome.getByLabel('Stylesheet', { exact: true })).toHaveValue('none');
  });

  test('UIC-LABS-2.3 UIC-LABS-2.4 remembers a choice made in the chrome and writes it to the query string', async ({
    page,
    lab,
  }) => {
    await lab.open('provider', { stylesheet: 'reference' });
    const chrome = page.locator('#lab-chrome');
    await chrome.getByLabel('Stylesheet', { exact: true }).selectOption('custom');
    await chrome.getByLabel('Stylesheet URL').fill(CUSTOM_SHEET);
    await chrome.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-lab-stylesheet-state', 'loaded');
    expect(await background(page)).toBe('rgb(1, 2, 3)');
    expect(new URL(page.url()).searchParams.get('stylesheet')).toBe(CUSTOM_SHEET);

    await chrome.getByLabel('Theme').fill('dark');
    expect(new URL(page.url()).searchParams.get('theme')).toBe('dark');

    await page.goto('provider.html');
    await waitForLab(page);
    expect(await background(page)).toBe('rgb(1, 2, 3)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('UIC-LABS-1.1 the index lists every lab and carries the settings into it', async ({
    page,
  }) => {
    await page.goto(labUrl('index', { stylesheet: 'none', theme: 'dark' }));
    await waitForLab(page);
    const link = page.getByRole('link', { name: 'Provider' });
    await expect(link).toHaveAttribute('href', 'provider.html?stylesheet=none&theme=dark');
    await link.click();
    await waitForLab(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.locator('#lab-chrome').getByRole('link', { name: 'All labs' }),
    ).toHaveAttribute('href', 'index.html?stylesheet=none&theme=dark');
  });

  test('UIC-LABS-3.2 the state matrix addresses every cell', async ({ page, lab }) => {
    await lab.open('provider');
    const cells = page.locator('table[data-lab-matrix="glyph source"] td[data-lab-cell]');
    expect(await cells.count()).toBe(26 * 2);
    await expect(
      page.locator('[data-lab-cell="glyph=check source=replaced"] svg[data-glyph="check"] rect'),
    ).toHaveCount(1);
  });

  test('UIC-LABS-3.3 the provider lab is accessible', async ({ lab }) => {
    await lab.open('provider');
    await lab.expectAccessible();
  });
});
