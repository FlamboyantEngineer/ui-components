import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const pageWidthAt100 = 420 * (96 / 72);

async function openReader(page: Page, lab: { open(name: string): Promise<void> }) {
  await lab.open('pdf-viewer');
  const reader = page.locator('[data-lab-case="reader"]');
  await expect(
    reader.locator('.ui-pdf-viewer__text-layer [role="presentation"]').first(),
  ).toBeVisible();
  return reader;
}

function box(locator: Locator) {
  return locator.boundingBox().then((value) => {
    if (!value) throw new Error('element has no box');
    return value;
  });
}

test.describe('PDF Viewer lab', () => {
  test('UIC-PDF-VIEWER-1.1 UIC-PDF-VIEWER-2.1 UIC-PDF-VIEWER-2.2 draws the sample from its URL and its bytes', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    await expect(reader.locator('.ui-pdf-viewer__page')).toHaveCount(3);
    const first = reader.locator('.ui-pdf-viewer__page').first();
    const canvasWidth = await first
      .locator('canvas')
      .evaluate((canvas: HTMLCanvasElement) => canvas.width);
    expect(canvasWidth).toBeGreaterThan(0);
    const title = first.locator('[role="presentation"]', { hasText: 'Seasonal Report' });
    const pageBox = await box(first);
    const titleBox = await box(title);
    expect(titleBox.x).toBeGreaterThan(pageBox.x);
    expect(titleBox.y).toBeGreaterThan(pageBox.y);
    expect(titleBox.x + titleBox.width).toBeLessThan(pageBox.x + pageBox.width);

    const bytes = page.locator('[data-lab-case="bytes"] .ui-pdf-viewer');
    await expect(bytes).not.toHaveAttribute('data-loading');
    await expect(bytes.locator('.ui-pdf-viewer__text-layer').first()).toContainText(
      'Seasonal Report',
    );
  });

  test('UIC-PDF-VIEWER-1.3 UIC-PDF-VIEWER-1.4 shows the loading and error states', async ({
    page,
    lab,
  }) => {
    await lab.open('pdf-viewer');
    const loading = page.locator('[data-lab-cell="state=loading"] .ui-pdf-viewer');
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('.ui-loading-overlay')).toBeVisible();
    await expect(loading.getByRole('slider', { name: 'Zoom level' })).toBeDisabled();

    const failed = page.locator('[data-lab-cell="state=error"]');
    await expect(failed.getByRole('alert')).toContainText('The document could not be opened.');
    await expect(failed.locator('.ui-pdf-viewer')).toHaveAttribute('data-error', 'true');
    await expect(failed.locator('[data-lab-output="errors"]')).toHaveText('1');
    await failed.getByRole('button', { name: 'Retry' }).click();
    await expect(failed.locator('[data-lab-output="errors"]')).toHaveText('2');
  });

  test('UIC-PDF-VIEWER-5.1 UIC-PDF-VIEWER-5.2 UIC-PDF-VIEWER-5.3 finds, highlights and steps through matches', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    const status = reader.locator('.ui-pdf-viewer__search-status');
    const field = reader.getByRole('searchbox', { name: 'Find in document' });
    await field.fill('HARVEST');
    await expect(status).toHaveText('1 of 4');
    const current = reader.locator('.ui-pdf-viewer__match[data-current]');
    await expect(current).toHaveText('harvest');
    const word = await box(current);
    expect(word.width).toBeGreaterThan(20);
    expect(word.height).toBeGreaterThan(8);

    await field.press('Enter');
    await field.press('Enter');
    await expect(status).toHaveText('3 of 4');
    await expect(reader.getByLabel('Page', { exact: true })).toHaveValue('2');
    const scroller = await box(reader.locator('.ui-pdf-viewer__scroller'));
    const match = await box(current);
    expect(match.y).toBeGreaterThan(scroller.y);
    expect(match.y + match.height).toBeLessThan(scroller.y + scroller.height);
    await field.press('Shift+Enter');
    await expect(status).toHaveText('2 of 4');
    await reader.getByRole('button', { name: 'Next match' }).click();
    await reader.getByRole('button', { name: 'Next match' }).click();
    await reader.getByRole('button', { name: 'Next match' }).click();
    await expect(status).toHaveText('1 of 4');

    await field.fill('quince');
    await expect(status).toHaveText('No results');
    await field.press('Escape');
    await expect(reader.locator('.ui-pdf-viewer__match')).toHaveCount(0);
  });

  test('UIC-PDF-VIEWER-2.2 selects page text with the pointer', async ({ page, lab }) => {
    const reader = await openReader(page, lab);
    const line = reader
      .locator('.ui-pdf-viewer__page')
      .first()
      .locator('[role="presentation"]', { hasText: 'Orchards across' });
    await line.scrollIntoViewIfNeeded();
    const bounds = await box(line);
    await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + bounds.height / 2, { steps: 10 });
    await page.mouse.up();
    expect(await page.evaluate(() => String(window.getSelection()))).toBe(
      'Orchards across the valley had a strong year.',
    );
  });

  test('UIC-PDF-VIEWER-3.1 UIC-PDF-VIEWER-3.2 UIC-PDF-VIEWER-3.3 zooms, fits and keeps the reading position', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    const scroller = reader.locator('.ui-pdf-viewer__scroller');
    const first = reader.locator('.ui-pdf-viewer__page').first();
    const column = await scroller.evaluate((element) => element.clientWidth - 24);
    expect((await box(first)).width).toBeCloseTo(column, 0);
    const fitted = Number(await reader.locator('[data-lab-output="zoom"]').textContent());
    await expect(reader.getByRole('button', { name: 'Fit page width' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await reader.getByRole('button', { name: 'Next page' }).click();
    await reader.getByRole('button', { name: 'Zoom in' }).click();
    const next = Math.floor(fitted / 25) * 25 + 25;
    await expect(reader.locator('[data-lab-output="zoom"]')).toHaveText(String(next));
    await expect(reader.locator('.ui-zoom-control__value')).toHaveText(`${next}%`);
    expect((await box(first)).width).toBeCloseTo((pageWidthAt100 * next) / 100, 0);
    await expect(reader.getByLabel('Page', { exact: true })).toHaveValue('2');
    const second = await box(reader.locator('.ui-pdf-viewer__page').nth(1));
    expect(Math.abs(second.y - (await box(scroller)).y)).toBeLessThan(20);

    await reader.getByRole('button', { name: 'Fit whole page' }).click();
    const height = await scroller.evaluate((element) => element.clientHeight - 24);
    expect((await box(first)).height).toBeLessThanOrEqual(height + 1);
    await expect(reader.getByLabel('Page', { exact: true })).toHaveValue('2');
  });

  test('UIC-PDF-VIEWER-3.4 zooms with Ctrl and the wheel instead of the page', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    const zoom = reader.locator('[data-lab-output="zoom"]');
    const fitted = Number(await zoom.textContent());
    await reader.locator('.ui-pdf-viewer__scroller').hover();
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120);
    await page.keyboard.up('Control');
    await expect(zoom).toHaveText(String(Math.floor(fitted / 25) * 25 + 25));
    expect(await page.evaluate(() => window.visualViewport?.scale ?? 1)).toBe(1);
  });

  test('UIC-PDF-VIEWER-4.1 UIC-PDF-VIEWER-4.2 goes to pages with the buttons and the field', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    const field = reader.getByLabel('Page', { exact: true });
    const scroller = reader.locator('.ui-pdf-viewer__scroller');
    const pages = reader.locator('.ui-pdf-viewer__page');
    const offsetInScroller = async (target: Locator) =>
      (await box(target)).y - (await box(scroller)).y;
    const restingTop = await offsetInScroller(pages.first());
    await expect(reader.locator('.ui-pdf-viewer__page-total')).toHaveText('of 3');
    await expect(reader.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await reader.getByRole('button', { name: 'Next page' }).click();
    await expect(field).toHaveValue('2');
    expect(await offsetInScroller(pages.nth(1))).toBeCloseTo(restingTop, 0);

    await field.fill('3');
    await field.press('Enter');
    await expect(field).toHaveValue('3');
    await expect(reader.getByRole('button', { name: 'Next page' })).toBeDisabled();
    await scroller.evaluate((element) => element.scrollTo({ top: 0 }));
    await expect(field).toHaveValue('1');
  });

  test('UIC-PDF-VIEWER-6.1 UIC-PDF-VIEWER-2.3 works from the keyboard', async ({ page, lab }) => {
    const reader = await openReader(page, lab);
    const field = reader.getByRole('searchbox', { name: 'Find in document' });
    await field.fill('pear');
    await field.press('ArrowLeft');
    await expect(field).toBeFocused();
    expect(await field.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(3);
    await field.press('Home');
    await field.press('ArrowLeft');
    await expect(reader.getByRole('button', { name: 'Next page' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(field).toBeFocused();

    await page.keyboard.press('Tab');
    const scroller = reader.getByRole('document', { name: 'Seasonal report' });
    await expect(scroller).toBeFocused();
    await page.keyboard.press('PageDown');
    await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    await reader.getByRole('button', { name: 'Download' }).click();
    await expect(reader.locator('[data-lab-output="downloads"]')).toHaveText('1');
  });

  test('UIC-PDF-VIEWER-6.1 is accessible with matches highlighted', async ({ page, lab }) => {
    // Six documents open at once, each with its own engine worker, before axe runs.
    test.slow();
    const reader = await openReader(page, lab);
    await reader.getByRole('searchbox').fill('harvest');
    await expect(reader.locator('.ui-pdf-viewer__search-status')).toHaveText('1 of 4');
    await lab.expectAccessible();
  });

  test('UIC-PDF-VIEWER-6.1 is accessible in the dark theme', async ({ page, lab }) => {
    test.slow();
    await lab.open('pdf-viewer', { theme: 'dark' });
    await expect(
      page
        .locator('[data-lab-case="reader"] .ui-pdf-viewer__text-layer [role="presentation"]')
        .first(),
    ).toBeVisible();
    await lab.expectAccessible();
  });
});
