import type { Page } from '@playwright/test';
import { expect, formatLabUrl, test, waitForLab, matrixCell } from './fixtures.js';

const customSheet = 'data:text/css,html%7Bbackground-color%3Argb(1%2C%202%2C%203)%7D';

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
    await expect(matrixCell(page, 'glyph=close source=default').locator('svg')).toBeVisible();
    const unstyled = await background(page);

    await lab.open('provider', { stylesheet: 'reference' });
    await expect(page.locator('#ui-lab-stylesheet')).toHaveAttribute('href', 'build/reference.css');
    expect(await background(page)).toBe('rgb(255, 255, 255)');
    const glyph = matrixCell(page, 'glyph=close source=default').locator('.ui-glyph');
    expect((await glyph.boundingBox())?.width).toBeLessThan(40);

    await lab.open('provider', { stylesheet: customSheet });
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
    await expect(chrome.getByLabel('Theme', { exact: true })).toHaveValue('dark');

    await lab.open('provider', { stylesheet: 'none', theme: 'night', themeAttribute: 'data-mode' });
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'night');
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
    await expect(chrome.getByLabel('Stylesheet', { exact: true })).toHaveValue('none');
    await expect(chrome.getByLabel('Theme', { exact: true })).toHaveValue('custom');
    await expect(chrome.getByLabel('Theme value')).toHaveValue('night');
  });

  test("UIC-LABS-2.2 follows the reader's colour scheme until a light or dark theme is chosen", async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await lab.open('provider');
    const chrome = page.locator('#lab-chrome');
    await expect(chrome.getByLabel('Theme', { exact: true })).toHaveValue('system');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await background(page)).toBe('rgb(13, 17, 23)');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(await background(page)).toBe('rgb(255, 255, 255)');

    await chrome.getByLabel('Theme', { exact: true }).selectOption('dark');
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page).toHaveURL((url) => url.searchParams.get('theme') === 'dark');
    await expect(chrome).toHaveCSS('color-scheme', 'dark');
  });

  test('UIC-LABS-2.5 applies the stylesheet and theme from the head, before the lab script runs', async ({
    page,
  }) => {
    // Without the lab's own script, only the head can have applied the settings.
    await page.route('**/build/provider.js', (route) => route.abort());
    await page.goto(formatLabUrl('provider', { stylesheet: 'reference', theme: 'dark' }));
    const link = page.locator('head > link#ui-lab-stylesheet');
    await expect(link).toHaveAttribute('href', 'build/reference.css');
    await expect(link).toHaveAttribute('blocking', 'render');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-lab-stylesheet-state', 'loaded');
    expect(await background(page)).toBe('rgb(13, 17, 23)');
  });

  test('UIC-LABS-2.3 UIC-LABS-2.4 remembers a choice made in the chrome and writes it to the query string', async ({
    page,
    lab,
  }) => {
    await lab.open('provider', { stylesheet: 'reference' });
    const chrome = page.locator('#lab-chrome');
    await chrome.getByLabel('Stylesheet', { exact: true }).selectOption('custom');
    await chrome.getByLabel('Stylesheet URL').fill(customSheet);
    await chrome.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-lab-stylesheet-state', 'loaded');
    expect(await background(page)).toBe('rgb(1, 2, 3)');
    await expect(page).toHaveURL((url) => url.searchParams.get('stylesheet') === customSheet);

    await chrome.getByLabel('Theme', { exact: true }).selectOption('dark');
    await expect(page).toHaveURL((url) => url.searchParams.get('theme') === 'dark');

    await page.goto('provider.html');
    await waitForLab(page);
    expect(await background(page)).toBe('rgb(1, 2, 3)');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('UIC-LABS-2.3 leaves a setting at its default out of the query string', async ({ page }) => {
    await page.goto(formatLabUrl('index', { stylesheet: 'reference', theme: 'dark' }));
    await waitForLab(page);
    await expect(page.getByRole('link', { name: 'Provider' })).toHaveAttribute(
      'href',
      'provider.html?theme=dark',
    );
  });

  test('UIC-LABS-1.1 the index lists every lab and carries the settings into it', async ({
    page,
  }) => {
    await page.goto(formatLabUrl('index', { stylesheet: 'none', theme: 'dark' }));
    await waitForLab(page);
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Foundations',
      'Primitives',
      'Fields',
      'Assemblies',
      'Widgets',
    ]);
    const primitives = page.locator('#lab-index > section').filter({
      has: page.getByRole('heading', { level: 2, name: 'Primitives' }),
    });
    await expect(primitives.getByRole('heading', { level: 3 }).first()).toHaveText('Display');
    const link = page.getByRole('link', { name: 'Provider' });
    await expect(link).toHaveAttribute('href', 'provider.html?stylesheet=none&theme=dark');
    await link.click();
    await waitForLab(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.locator('#lab-chrome').getByRole('link', { name: 'All labs' }),
    ).toHaveAttribute('href', 'index.html?stylesheet=none&theme=dark');
  });

  test('UIC-LABS-3.1 loads the reference theme with one stylesheet request', async ({
    page,
    lab,
  }) => {
    const stylesheets: string[] = [];
    page.on('request', (request) => {
      if (request.resourceType() === 'stylesheet')
        stylesheets.push(new URL(request.url()).pathname);
    });
    await lab.open('provider');
    expect(stylesheets).toEqual(['/build/reference.css']);
  });

  test('UIC-LABS-3.1 keeps the lab page layout out of the reference sheet, and its document base opt-in', async ({
    page,
    lab,
  }) => {
    const rootStyle = () =>
      page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        const root = document.getElementById('lab-root') ?? document.body;
        const padding = getComputedStyle(root).paddingTop;
        return { background: style.backgroundColor, scheme: style.colorScheme, padding };
      });
    await lab.open('provider', { stylesheet: 'none' });
    expect(await rootStyle()).toMatchObject({ background: 'rgba(0, 0, 0, 0)', padding: '16px' });
    await lab.open('provider');
    expect(await rootStyle()).toEqual({
      background: 'rgb(255, 255, 255)',
      scheme: 'light',
      padding: '16px',
    });
    await page.evaluate(() => document.documentElement.removeAttribute('data-reference-document'));
    expect(await rootStyle()).toEqual({
      background: 'rgba(0, 0, 0, 0)',
      scheme: 'normal',
      padding: '16px',
    });
  });

  test('UIC-LABS-2.1 recovers from an invalid stylesheet URL', async ({ page, lab }) => {
    await page.goto(formatLabUrl('provider', { stylesheet: 'http://[' }));
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-lab-stylesheet-state', 'error');
    await page
      .locator('#lab-chrome')
      .getByLabel('Stylesheet', { exact: true })
      .selectOption('reference');
    await waitForLab(page);
    expect(lab.errors).toEqual([]);
  });

  test('UIC-LABS-2.3 keeps every index link current after repeated toolbar changes', async ({
    page,
  }) => {
    await page.goto(formatLabUrl('index'));
    await waitForLab(page);
    const chrome = page.locator('#lab-chrome');
    await chrome.getByLabel('Stylesheet', { exact: true }).selectOption('none');
    await chrome.getByLabel('Theme', { exact: true }).selectOption('dark');
    const links = page.locator('#lab-index a');
    const hrefs = await links.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href')),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const query = new URL(href ?? '', page.url()).searchParams;
      expect(query.get('stylesheet')).toBe('none');
      expect(query.get('theme')).toBe('dark');
    }
    await page.getByRole('link', { name: 'Provider', exact: true }).click();
    await waitForLab(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('html')).toHaveAttribute('data-lab-stylesheet-state', 'none');
  });

  test('UIC-LABS-3.2 the state matrix addresses every cell', async ({ page, lab }) => {
    await lab.open('provider');
    const cells = page.locator('table[data-lab-matrix="glyph source"] td[data-lab-cell]');
    const rows = await page.locator('table[data-lab-matrix="glyph source"] tbody tr').count();
    expect(rows).toBeGreaterThanOrEqual(26);
    expect(await cells.count()).toBe(rows * 2);
    await expect(
      matrixCell(page, 'glyph=check source=replaced').locator('svg[data-glyph="check"] rect'),
    ).toHaveCount(1);
  });

  test('UIC-LABS-3.3 the provider lab is accessible', async ({ lab }) => {
    await lab.open('provider');
    await lab.expectAccessible();
  });

  test('UIC-LABS-3.3 reports a deliberate accessibility violation', async ({ page, lab }) => {
    await lab.open('provider');
    await page.locator('#lab-root').evaluate((root) => {
      const image = document.createElement('img');
      image.width = 24;
      image.height = 24;
      image.src =
        'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22%3E%3Crect width=%2224%22 height=%2224%22 fill=%22red%22/%3E%3C/svg%3E';
      root.append(image);
    });
    await expect(lab.expectAccessible()).rejects.toThrow('image-alt');
  });

  test('UIC-LABS-3.3 reports an incomplete result no entry accepts', async ({ page, lab }) => {
    await lab.open('provider');
    await page.locator('#lab-root').evaluate((root) => {
      const span = document.createElement('span');
      span.setAttribute('aria-label', 'Unexplained');
      span.textContent = 'Text';
      root.append(span);
    });
    await expect(lab.expectAccessible()).rejects.toThrow('aria-prohibited-attr');
  });
});
