import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const pageWidthAt100 = 420 * (96 / 72);

type LabOpener = { open(name: string): Promise<void> };

/** Opens the lab and waits until the case's first page shows its text. */
async function openCase(page: Page, lab: LabOpener, name: string) {
  await lab.open('pdf-viewer');
  const root = page.locator(`[data-lab-case="${name}"]`);
  // The lab opens a dozen documents at once, each with its own engine worker.
  await expect(
    root.locator('.ui-pdf-viewer__text-layer [role="presentation"]').first(),
  ).toBeVisible({ timeout: 30_000 });
  return root;
}

function openReader(page: Page, lab: LabOpener) {
  return openCase(page, lab, 'reader');
}

function box(locator: Locator) {
  return locator.boundingBox().then((value) => {
    if (!value) throw new Error('element has no box');
    return value;
  });
}

function expectNear(actual: number, expected: number, tolerance = 1.5) {
  expect(Math.abs(actual - expected), `${actual} is near ${expected}`).toBeLessThan(tolerance);
}

/** Selects a text run with the pointer, from its first to its last character. */
async function selectRun(page: Page, run: Locator) {
  await run.scrollIntoViewIfNeeded();
  const bounds = await box(run);
  await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + bounds.height / 2, { steps: 10 });
  await page.mouse.up();
  return bounds;
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
    const loading = matrixCell(page, 'state=loading').locator('.ui-pdf-viewer');
    await expect(loading).toHaveAttribute('aria-busy', 'true');
    await expect(loading.locator('.ui-loading-overlay')).toBeVisible();
    await expect(loading.getByRole('slider', { name: 'Zoom level' })).toBeDisabled();

    const failed = matrixCell(page, 'state=error');
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
    const status = reader.locator('.ui-find-bar__status');
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
    await selectRun(page, line);
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

    await reader.getByRole('button', { name: 'Share' }).click();
    await expect(reader.locator('[data-lab-output="shares"]')).toHaveText('1');
  });

  test('UIC-PDF-VIEWER-7.1 UIC-PDF-VIEWER-7.2 UIC-PDF-VIEWER-7.3 UIC-PDF-VIEWER-7.4 draws marks on their pages in page coordinates and reveals them', async ({
    page,
    lab,
  }) => {
    const annotated = await openCase(page, lab, 'annotated');
    const mark = annotated.locator('[data-lab-mark="heading"]');
    const third = annotated.locator('.ui-pdf-viewer__page').nth(2);
    await annotated.getByRole('button', { name: 'Reveal Markets heading' }).click();
    await expect(annotated.getByLabel('Page', { exact: true })).toHaveValue('3');
    await expect(mark).toBeVisible();
    await expect(annotated.locator('[data-lab-output="viewports"]')).toContainText('3');

    const scroller = await box(annotated.locator('.ui-pdf-viewer__scroller'));
    const firstPage = await box(annotated.locator('.ui-pdf-viewer__page').first());
    expect(firstPage.y).toBeLessThan(scroller.y);
    expectNear((await box(mark)).y - scroller.y, 12);

    const expectOnPage = async () => {
      const pageBox = await box(third);
      const markBox = await box(mark);
      const scale = pageBox.width / 420;
      expectNear(markBox.x - pageBox.x, 44 * scale);
      expectNear(markBox.y - pageBox.y, 56 * scale);
      expectNear(markBox.width, 92 * scale);
      const heading = await box(third.locator('[role="presentation"]', { hasText: 'Markets' }));
      expect(heading.x).toBeGreaterThan(markBox.x);
      expect(heading.y + heading.height / 2).toBeLessThan(markBox.y + markBox.height);
      expect(heading.y + heading.height / 2).toBeGreaterThan(markBox.y);
    };
    await expectOnPage();
    await expect(third.locator('.ui-pdf-viewer__overlay')).toHaveCSS('pointer-events', 'none');
    await annotated.getByRole('button', { name: 'Zoom out' }).click();
    await expectOnPage();
    // A narrower column moves the pages, and the marks with them.
    const pageX = (await box(third)).x;
    await annotated
      .locator('> div')
      .first()
      .evaluate((frame: HTMLElement) => {
        frame.style.maxWidth = '520px';
      });
    await expect.poll(async () => (await box(third)).x).toBeLessThan(pageX - 10);
    await expectOnPage();
  });

  test('UIC-PDF-VIEWER-8.1 UIC-PDF-VIEWER-8.2 UIC-PDF-VIEWER-8.3 UIC-PDF-VIEWER-8.4 copies, marks and removes from the context menu', async ({
    page,
    context,
    lab,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const annotated = await openCase(page, lab, 'annotated');
    const first = annotated.locator('.ui-pdf-viewer__page').first();
    const blank = await box(first);
    const prevented = await first.evaluate(
      (element, point) =>
        !element.dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, cancelable: true, ...point }),
        ),
      { clientX: blank.x + blank.width - 10, clientY: blank.y + blank.height - 10 },
    );
    expect(prevented).toBe(true);
    await expect(page.locator('.ui-menu-popover')).toHaveCount(0);

    const line = first.locator('[role="presentation"]', { hasText: 'Orchards across' });
    const lineBox = await selectRun(page, line);
    const menu = page.getByRole('menu', { name: 'Context menu' });
    await page.mouse.click(lineBox.x + 20, lineBox.y + lineBox.height / 2, { button: 'right' });
    await expect(menu.getByRole('menuitem')).toHaveText(['Copy', 'Mark selection']);
    await lab.expectAccessible('.ui-menu-popover');
    await menu.getByRole('menuitem', { name: 'Copy' }).click();
    await expect(menu).toHaveCount(0);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'Orchards across the valley had a strong year.',
    );

    await selectRun(page, line);
    await page.mouse.click(lineBox.x + 20, lineBox.y + lineBox.height / 2, { button: 'right' });
    await menu.getByRole('menuitem', { name: 'Mark selection' }).click();
    const mark = annotated.locator('[data-lab-mark="mark-1"]');
    const markBox = await box(mark);
    expectNear(markBox.x, lineBox.x, 3);
    expectNear(markBox.y, lineBox.y, 3);
    expectNear(markBox.width, lineBox.width, 6);

    await page.mouse.click(blank.x + blank.width - 10, blank.y + blank.height - 10);
    expect(await page.evaluate(() => String(window.getSelection()))).toBe('');
    await page.mouse.click(markBox.x + 10, markBox.y + markBox.height / 2, { button: 'right' });
    await expect(menu.getByRole('menuitem')).toHaveText(['Remove mark']);
    await menu.getByRole('menuitem', { name: 'Remove mark' }).click();
    await expect(mark).toHaveCount(0);
  });

  test('UIC-PDF-VIEWER-5.4 UIC-PDF-VIEWER-5.5 UIC-PDF-VIEWER-5.6 lets the caller own the find', async ({
    page,
    lab,
  }) => {
    const find = await openCase(page, lab, 'find');
    await expect(find.getByRole('searchbox', { name: 'Find in document' })).toHaveCount(0);
    const field = find.getByRole('searchbox', { name: 'Find everywhere' });
    const matches = find.locator('[data-lab-output="matches"]');
    await field.fill('harvest');
    await expect(find.locator('[data-lab-output="query"]')).toHaveText('harvest');
    await expect(matches).toHaveText('1 of 4');
    await expect(find.locator('.ui-pdf-viewer__match[data-current]')).toHaveText('harvest');
    await find.getByRole('button', { name: 'Forward', exact: true }).click();
    await find.getByRole('button', { name: 'Forward', exact: true }).click();
    await expect(matches).toHaveText('3 of 4');
    await expect(find.locator('[data-lab-output="match"]')).toHaveText('2');
    await expect(find.getByLabel('Page', { exact: true })).toHaveValue('2');
    await find.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(matches).toHaveText('2 of 4');

    await find.getByRole('button', { name: 'Find pears' }).click();
    await expect(field).toHaveValue('pear');
    await expect(matches).toHaveText(/of 2$/);
  });

  test('UIC-PDF-VIEWER-6.3 UIC-PDF-VIEWER-6.1 UIC-PDF-VIEWER-4.3 projects the toolbar above a panel and follows the contents', async ({
    page,
    lab,
  }) => {
    const projected = await openCase(page, lab, 'projected');
    const band = projected.locator('[data-lab-band]');
    const toolbar = band.getByRole('toolbar', { name: 'Report beside its contents controls' });
    await expect(toolbar).toBeVisible();
    await expect(projected.locator('.ui-pdf-viewer .ui-pdf-viewer__toolbar')).toHaveCount(0);
    expectNear((await box(toolbar)).x, (await box(projected)).x);
    const leading = toolbar.locator('.ui-pdf-viewer__leading-actions').getByRole('button');
    await expect(leading).toHaveText('Hide contents');

    const output = page.locator('[data-lab-section="Toolbar elsewhere"] [data-lab-output="page"]');
    const field = band.getByLabel('Page', { exact: true });
    await projected.getByRole('button', { name: 'Markets' }).click();
    await expect(field).toHaveValue('3');
    await expect(output).toHaveText('3');
    const scroller = projected.locator('.ui-pdf-viewer__scroller');
    await scroller.evaluate((element) => element.scrollTo({ top: 0 }));
    await expect(output).toHaveText('1');
    await expect(field).toHaveValue('1');

    const firstPage = projected.locator('.ui-pdf-viewer__page').first();
    const before = (await box(firstPage)).width;
    await toolbar.getByRole('button', { name: 'Zoom in' }).click();
    await expect.poll(async () => (await box(firstPage)).width).toBeGreaterThan(before);
    await leading.click();
    await expect(projected.getByRole('navigation', { name: 'Contents' })).toHaveCount(0);
    await expect(leading).toHaveText('Show contents');
  });

  test('UIC-PDF-VIEWER-1.5 requests the document with the caller headers', async ({
    page,
    lab,
  }) => {
    const request = page.waitForRequest(
      (sent) =>
        sent.url().endsWith('seasonal-report.pdf') &&
        sent.headers()['x-lab-sample'] === 'seasonal-report',
    );
    await openReader(page, lab);
    await request;
  });

  test('UIC-PDF-VIEWER-1.6 asks for the password of a protected document', async ({
    page,
    lab,
  }) => {
    // A dozen documents open at once, each with its own engine worker, before axe runs.
    test.slow();
    await lab.open('pdf-viewer');
    const cell = matrixCell(page, 'state=locked');
    const field = cell.getByLabel('Password');
    await expect(field).toBeVisible({ timeout: 30_000 });
    await expect(cell.locator('.ui-pdf-viewer')).toHaveAttribute('data-locked', 'true');
    await expect(cell.locator('.ui-pdf-viewer')).not.toHaveAttribute('aria-busy');
    await lab.expectAccessible('[data-lab-cell="state=locked"]');

    await field.fill('apple');
    await field.press('Enter');
    await expect(cell.getByText('The password is incorrect. Try again.')).toBeVisible();
    await expect(field).toHaveValue('apple');
    await field.fill('orchard');
    await cell.getByRole('button', { name: 'Open' }).click();
    await expect(cell.locator('.ui-pdf-viewer__text-layer').first()).toContainText(
      'Seasonal Report',
    );
    await expect(cell.locator('.ui-pdf-viewer')).not.toHaveAttribute('data-locked');
    await expect(cell.locator('.ui-pdf-viewer__password')).toHaveCount(0);
  });

  test('UIC-PDF-VIEWER-2.4 follows the links of a page', async ({ page, lab }) => {
    const reader = await openReader(page, lab);
    const first = reader.locator('.ui-pdf-viewer__page').first();
    const web = first.getByRole('link', { name: 'https://example.com/' });
    await expect(web).toHaveAttribute('href', 'https://example.com/');
    await expect(web).toHaveAttribute('target', '_blank');
    await expect(web).toHaveAttribute('rel', 'nofollow noopener noreferrer');

    const markets = first.getByRole('link', { name: 'See the markets on page 3.' });
    const line = first.locator('[role="presentation"]', { hasText: 'See the markets' });
    const linkBox = await box(markets);
    const lineBox = await box(line);
    expect(linkBox.x).toBeLessThanOrEqual(lineBox.x + 1);
    expect(linkBox.x + linkBox.width).toBeGreaterThanOrEqual(lineBox.x + lineBox.width - 2);
    expect(lineBox.y + lineBox.height / 2).toBeGreaterThan(linkBox.y);
    expect(lineBox.y + lineBox.height / 2).toBeLessThan(linkBox.y + linkBox.height);
    // Between the links the layer lets the pointer through to the text.
    const orchards = first.locator('[role="presentation"]', { hasText: 'Orchards across' });
    await selectRun(page, orchards);
    expect(await page.evaluate(() => String(window.getSelection()))).toBe(
      'Orchards across the valley had a strong year.',
    );

    await markets.click();
    await expect(reader.getByLabel('Page', { exact: true })).toHaveValue('3');
  });

  test('UIC-PDF-VIEWER-2.5 draws no links while annotations are switched off', async ({
    page,
    lab,
  }) => {
    const reader = await openCase(page, lab, 'annotations');
    const first = reader.locator('.ui-pdf-viewer__page').first();
    await expect(first.locator('[role="presentation"]').first()).toBeVisible();
    await expect(first.getByRole('link')).toHaveCount(0);
    await expect(first.locator('.ui-pdf-viewer__annotation-layer')).toBeEmpty();
    const toggle = reader.getByRole('switch', { name: 'Show annotations' });
    await reader.getByText('Show annotations').click();
    await expect(toggle).toBeChecked();
    await expect(first.getByRole('link', { name: 'https://example.com/' })).toBeVisible();
    await reader.getByText('Show annotations').click();
    await expect(toggle).not.toBeChecked();
    await expect(first.getByRole('link')).toHaveCount(0);
  });

  test('UIC-PDF-VIEWER-3.5 UIC-PDF-VIEWER-4.6 UIC-PDF-VIEWER-5.8 answers the reader keyboard', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    const zoom = reader.locator('[data-lab-output="zoom"]');
    const fitted = Number(await zoom.textContent());
    const field = reader.getByLabel('Page', { exact: true });
    await reader.locator('.ui-pdf-viewer__scroller').focus();
    await page.keyboard.press('Control+Shift+Equal');
    await expect(zoom).toHaveText(String(Math.floor(fitted / 25) * 25 + 25));
    await page.keyboard.press('Control+Minus');
    await page.keyboard.press('Control+Minus');
    await expect(zoom).toHaveText(String(Math.floor(fitted / 25) * 25 - 25));
    await page.keyboard.press('Control+Digit0');
    await expect(zoom).toHaveText(String(fitted));

    await page.keyboard.press('End');
    await expect(field).toHaveValue('3');
    await page.keyboard.press('Home');
    await expect(field).toHaveValue('1');
    await page.keyboard.press('Control+KeyF');
    await expect(reader.getByRole('searchbox', { name: 'Find in document' })).toBeFocused();
  });

  test('UIC-PDF-VIEWER-5.7 matches case and whole words from the find options', async ({
    page,
    lab,
  }) => {
    // A dozen documents open at once, each with its own engine worker, before axe runs.
    test.slow();
    const reader = await openReader(page, lab);
    const status = reader.locator('.ui-find-bar__status');
    await reader.getByRole('searchbox', { name: 'Find in document' }).fill('pear');
    await expect(status).toHaveText('1 of 2');
    await reader.getByRole('button', { name: 'Find options' }).click();
    const menu = page.getByRole('menu', { name: 'Find options' });
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Highlight all' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await menu.getByRole('menuitemcheckbox', { name: 'Whole words' }).click();
    await expect(status).toHaveText('1 of 2');
    await menu.getByRole('menuitemcheckbox', { name: 'Match case' }).click();
    await expect(status).toHaveText('1 of 1');
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);

    // The lab is already open: the caller's find controls are in another case.
    const find = page.locator('[data-lab-case="find"]');
    await find.getByRole('searchbox', { name: 'Find everywhere' }).fill('Pear');
    await expect(find.locator('[data-lab-output="matches"]')).toHaveText('1 of 2');
    await find.getByRole('button', { name: 'Same case' }).click();
    await expect(find.locator('[data-lab-output="case"]')).toHaveText('same');
    await expect(find.locator('[data-lab-output="matches"]')).toHaveText('1 of 1');
  });

  test('UIC-PDF-VIEWER-4.4 UIC-PDF-VIEWER-4.5 UIC-PDF-VIEWER-10.1 UIC-PDF-VIEWER-10.2 UIC-PDF-VIEWER-10.3 opens on the outline and goes to destinations', async ({
    page,
    lab,
  }) => {
    // A dozen documents open at once, each with its own engine worker, before axe runs.
    test.slow();
    const reader = await openCase(page, lab, 'bytes');
    const field = reader.getByLabel('Page', { exact: true });
    await expect(field).toHaveValue('2');
    const tree = reader.getByRole('treegrid', { name: 'Outline' });
    await expect(tree.getByRole('row')).toHaveText([
      'Seasonal Report',
      'Varieties',
      'Apple',
      'Plum',
      'Markets',
    ]);
    await lab.expectAccessible('[data-lab-case="bytes"]');

    await tree.getByRole('row', { name: 'Markets' }).click();
    await expect(field).toHaveValue('3');
    // The destination's top, 47 points down the page, lands where a page top lands.
    const scroller = reader.locator('.ui-pdf-viewer__scroller');
    const third = reader.locator('.ui-pdf-viewer__page').nth(2);
    const scale = (await box(third)).width / 420;
    expectNear((await box(scroller)).y + 12 - (await box(third)).y, 47 * scale, 2);

    await reader.getByRole('tab', { name: 'Pages' }).click();
    const thumbnails = reader.getByRole('listbox', { name: 'Pages' });
    await expect(thumbnails.getByRole('option', { name: 'Page 3' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const firstThumbnail = thumbnails.getByRole('option', { name: 'Page 1' });
    await expect
      .poll(() =>
        firstThumbnail.locator('canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width),
      )
      .toBeGreaterThan(0);
    await firstThumbnail.click();
    await expect(field).toHaveValue('1');
    await reader.getByRole('button', { name: 'Go to varieties' }).click();
    await expect(field).toHaveValue('2');
    await expect(reader.locator('[data-lab-output="page"]')).toHaveText('2');

    const toggle = reader.getByRole('button', { name: 'Sidebar' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    const width = (await box(scroller)).width;
    await toggle.click();
    await expect(reader.locator('.ui-pdf-viewer__sidebar')).toHaveCount(0);
    await expect.poll(async () => (await box(scroller)).width).toBeGreaterThan(width + 100);
  });

  test('UIC-PDF-VIEWER-9.1 UIC-PDF-VIEWER-9.2 UIC-PDF-VIEWER-9.3 UIC-PDF-VIEWER-9.4 rotates, prints and saves from the menu', async ({
    page,
    lab,
  }) => {
    const reader = await openReader(page, lab);
    const choose = async (name: string) => {
      await reader.getByRole('button', { name: 'More options' }).click();
      await page.getByRole('menu').getByRole('menuitem', { name }).click();
    };
    const first = reader.locator('.ui-pdf-viewer__page').first();
    await choose('Rotate clockwise');
    await expect.poll(async () => (await box(first)).width > (await box(first)).height).toBe(true);
    const pageBox = await box(first);
    const title = await box(first.locator('[role="presentation"]', { hasText: 'Seasonal Report' }));
    // The title now reads downwards near the right edge of the turned page.
    expect(title.height).toBeGreaterThan(title.width);
    expect(title.x).toBeGreaterThan(pageBox.x + pageBox.width / 2);
    expect(title.y + title.height).toBeLessThan(pageBox.y + pageBox.height);
    await choose('Rotate counterclockwise');
    await expect.poll(async () => (await box(first)).height > (await box(first)).width).toBe(true);

    const download = page.waitForEvent('download');
    await choose('Download');
    expect((await download).suggestedFilename()).toBe('seasonal-report.pdf');

    // The browser's print dialog cannot open in a test: the frame's print reports what it holds.
    await page.evaluate(() => {
      const descriptor = Object.getOwnPropertyDescriptor(
        HTMLIFrameElement.prototype,
        'contentWindow',
      );
      Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
        configurable: true,
        get(this: HTMLIFrameElement) {
          const frameWindow = descriptor?.get?.call(this) as Window | null;
          if (frameWindow) {
            frameWindow.print = () => {
              document.body.dataset.printed = String(frameWindow.document.images.length);
              frameWindow.dispatchEvent(new Event('afterprint'));
            };
          }
          return frameWindow;
        },
      });
    });
    await choose('Print');
    await expect(page.locator('body')).toHaveAttribute('data-printed', '3', { timeout: 20_000 });
    await expect(page.locator('body > iframe')).toHaveCount(0);
  });

  test('UIC-PDF-VIEWER-11.1 reads an unrendered page and closes the handle on a new source', async ({
    page,
    lab,
  }) => {
    const reading = await openCase(page, lab, 'reading');
    const scroller = reading.locator('.ui-pdf-viewer__scroller');
    const pages = reading.locator('[data-lab-output="pages"]');
    const lastPage = reading.locator('[data-lab-output="last-page"]');
    await expect(pages).toHaveText('3 pages');
    await reading.getByRole('button', { name: 'Read the last page' }).click();
    await expect(lastPage).toHaveText('Markets');
    expect(await scroller.evaluate((element) => element.scrollTop)).toBe(0);

    await reading.getByRole('button', { name: 'Open the other copy' }).click();
    await expect(lastPage).toHaveText('');
    await expect(pages).toHaveText('3 pages', { timeout: 30_000 });
    await reading.getByRole('button', { name: 'Read the last page' }).click();
    await expect(lastPage).toHaveText('Markets');
  });

  test('UIC-PDF-VIEWER-11.2 UIC-PDF-VIEWER-11.3 reports clicks and finished selections at any zoom and rotation', async ({
    page,
    lab,
  }) => {
    const reading = await openCase(page, lab, 'reading');
    const first = reading.locator('.ui-pdf-viewer__page').first();
    const pins = reading.locator('[data-lab-pin]');
    await reading.locator('.ui-pdf-viewer').scrollIntoViewIfNeeded();
    const clickAndCheck = async (count: number) => {
      const bounds = await box(first);
      const spot = { x: bounds.x + bounds.width * 0.7, y: bounds.y + bounds.height * 0.3 };
      await page.mouse.click(spot.x, spot.y);
      await expect(pins).toHaveCount(count);
      const pin = await box(pins.last());
      expectNear(pin.x + pin.width / 2, spot.x, 2);
      expectNear(pin.y + pin.height / 2, spot.y, 2);
    };
    await clickAndCheck(1);
    await reading.getByRole('button', { name: 'Zoom in' }).click();
    await clickAndCheck(2);
    await reading.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Rotate clockwise' }).click();
    await clickAndCheck(3);
    await expect(reading.locator('[data-lab-output="pins"]')).toHaveText('page 1, page 1, page 1');

    const line = first.locator('[role="presentation"]', { hasText: 'Orchards across' });
    await reading.getByRole('button', { name: 'Zoom out' }).click();
    await reading.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Rotate counterclockwise' }).click();
    await selectRun(page, line);
    const selection = reading.locator('[data-lab-output="selection"]');
    await expect(selection).toHaveText('Orchards across the valley had a strong year.');
    await expect(pins).toHaveCount(3);
    await expect(page.locator('.ui-menu-popover')).toHaveCount(0);
    await reading.getByRole('button', { name: 'Note the selection' }).click();
    await expect(reading.locator('[data-lab-output="notes"]')).toHaveText(
      'Orchards across the valley had a strong year.',
    );
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    await expect(selection).toHaveText('');
  });

  test('UIC-PDF-VIEWER-11.4 reports the top of the view through scrolling and zoom', async ({
    page,
    lab,
  }) => {
    const reading = await openCase(page, lab, 'reading');
    const position = reading.locator('[data-lab-output="position"]');
    const scroller = reading.locator('.ui-pdf-viewer__scroller');
    await expect(position).toHaveText('page 1, 0 pt down');
    const second = reading.locator('.ui-pdf-viewer__page').nth(1);
    // Scrolls the second page's top 150 pixels above the view.
    await scroller.evaluate(
      (element, offset) => {
        element.scrollTop += offset;
      },
      (await box(second)).y - (await box(scroller)).y + 150,
    );
    const scale = await reading
      .locator('.ui-pdf-viewer')
      .evaluate((element) =>
        Number(getComputedStyle(element).getPropertyValue('--ui-pdf-viewer-scale')),
      );
    const expected = Math.round(150 / scale);
    await expect(position).toHaveText(
      new RegExp(`^page 2, (${expected - 1}|${expected}|${expected + 1}) pt down$`),
    );

    await reading.getByRole('button', { name: 'Zoom in' }).click();
    await expect(position).toHaveText(/^page 2, \d+ pt down$/);
    await scroller.evaluate((element) => {
      element.scrollTop = 0;
    });
    await expect(position).toHaveText('page 1, 0 pt down');
  });

  test.describe('on a touch screen', () => {
    test.use({ hasTouch: true });

    test('UIC-PDF-VIEWER-3.6 zooms with a pinch', async ({ page, lab }) => {
      const reader = await openReader(page, lab);
      const zoom = reader.locator('[data-lab-output="zoom"]');
      const fitted = Number(await zoom.textContent());
      const scroller = reader.locator('.ui-pdf-viewer__scroller');
      await scroller.scrollIntoViewIfNeeded();
      const area = await box(scroller);
      const x = area.x + area.width / 2;
      const y = area.y + area.height / 2;
      const session = await page.context().newCDPSession(page);
      const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', spread: number) =>
        session.send('Input.dispatchTouchEvent', {
          type,
          touchPoints:
            type === 'touchEnd'
              ? []
              : [
                  { x: x - spread, y, id: 1 },
                  { x: x + spread, y, id: 2 },
                ],
        });
      await touch('touchStart', 40);
      for (let spread = 70; spread <= 220; spread += 30) await touch('touchMove', spread);
      await touch('touchEnd', 0);
      // The fingers' span grew from 140 to 440 pixels once the pinch was recognised.
      await expect.poll(async () => Number(await zoom.textContent())).toBeGreaterThan(fitted * 2);
    });
  });

  test('UIC-PDF-VIEWER-6.1 is accessible with matches highlighted', async ({ page, lab }) => {
    // A dozen documents open at once, each with its own engine worker, before axe runs.
    test.slow();
    const reader = await openReader(page, lab);
    await reader.getByRole('searchbox').fill('harvest');
    await expect(reader.locator('.ui-find-bar__status')).toHaveText('1 of 4');
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

  test('UIC-PDF-VIEWER-1.7 opens, scrolls and searches a 250-page document', async ({
    page,
    lab,
  }, testInfo) => {
    await lab.open('pdf-viewer');
    const long = page.locator('[data-lab-case="long"]');
    await long.scrollIntoViewIfNeeded();
    const started = Date.now();
    await long.getByRole('button', { name: 'Open the long report' }).click();
    const firstText = long.locator('.ui-pdf-viewer__text-layer [role="presentation"]').first();
    await expect(firstText).toBeVisible({ timeout: 30_000 });
    const firstPageMs = Date.now() - started;
    await expect(long.locator('.ui-pdf-viewer__page')).toHaveCount(250);
    await expect(long.locator('.ui-pdf-viewer__page-total')).toHaveText('of 250');
    // Only the pages near the view draw; the others keep an empty canvas.
    const drawnPages = () =>
      long
        .locator('.ui-pdf-viewer__page canvas')
        .evaluateAll(
          (canvases) => canvases.filter((canvas) => (canvas as HTMLCanvasElement).width > 0).length,
        );
    expect(await drawnPages()).toBeLessThan(10);

    const field = long.getByLabel('Page', { exact: true });
    const scrollStart = Date.now();
    await field.fill('250');
    await field.press('Enter');
    await expect(field).toHaveValue('250');
    await expect(long.locator('.ui-pdf-viewer__page').last().locator('canvas')).not.toHaveAttribute(
      'width',
      '0',
    );
    const lastPageMs = Date.now() - scrollStart;

    const searchStart = Date.now();
    const find = long.getByRole('searchbox', { name: 'Find in document' });
    await find.fill('quinceberry');
    await expect(long.locator('.ui-find-bar__status')).toHaveText('1 of 1', { timeout: 30_000 });
    await expect(field).toHaveValue('248');
    await expect(long.locator('.ui-pdf-viewer__match[data-current]')).toHaveText('quinceberry');
    const searchMs = Date.now() - searchStart;

    testInfo.annotations.push({
      type: 'measurement',
      description: `first page ${firstPageMs} ms, last page ${lastPageMs} ms, search ${searchMs} ms`,
    });
    expect(firstPageMs).toBeLessThan(15_000);
    expect(await drawnPages()).toBeLessThan(10);
  });
});
