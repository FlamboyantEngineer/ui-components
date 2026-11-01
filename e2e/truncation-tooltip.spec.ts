import { expect, test, matrixCell } from './fixtures.js';

const FULL_TEXT = 'Quarterly report for the northern region, final edition.pdf';

test.describe('Truncation Tooltip lab', () => {
  test('UIC-TRUNCATION-TOOLTIP-1.5 shows the text of a link without its id or a reachable copy of the link', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const text = page.locator('[data-lab-text="inner link"]');
    await text.hover();
    const panel = page.getByRole('tooltip');
    await expect(panel).toHaveText(FULL_TEXT);
    await expect(panel.locator('[id]')).toHaveCount(0);
    await expect(panel.locator('[inert] a')).toHaveCount(1);
    await expect(page.locator('#lab-inner-link')).toHaveCount(1);
  });

  test('UIC-TRUNCATION-TOOLTIP-1.1 UIC-TRUNCATION-TOOLTIP-1.2 shows cut text whole and leaves whole text alone', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const cut = matrixCell(page, 'text=cut holder=plain').locator('.ui-truncation-tooltip');
    const whole = matrixCell(page, 'text=whole holder=plain').locator('.ui-truncation-tooltip');
    expect(await cut.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await expect(cut).toHaveText(FULL_TEXT);

    await whole.hover();
    await page.waitForTimeout(800);
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    await cut.hover();
    // The exact delay is covered by the unit tests; here the tooltip must not appear at once.
    expect(await page.getByRole('tooltip').count()).toBe(0);
    const panel = page.getByRole('tooltip');
    await expect(panel).toHaveText(FULL_TEXT);
    await expect(panel).toHaveClass(/ui-truncation-tooltip__panel/);
    await expect(cut).not.toHaveAttribute('aria-describedby');
    await page.mouse.move(0, 0);
    await expect(panel).toHaveCount(0);
  });

  test('UIC-TRUNCATION-TOOLTIP-1.3 opens at once when keyboard focus reaches the holding link', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const link = matrixCell(page, 'text=cut holder=link').locator('a');
    await matrixCell(page, 'text=cut holder=plain').click();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    await expect(page.getByRole('tooltip')).toHaveText(FULL_TEXT);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('UIC-TRUNCATION-TOOLTIP-1.3 stays closed when a script focuses the link after a pointer press', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const link = matrixCell(page, 'text=cut holder=link').locator('a');
    await matrixCell(page, 'text=cut holder=plain').click();
    await link.evaluate((element: HTMLElement) => element.focus());
    await expect(link).toBeFocused();
    // The panel would open at once; give it a frame or two to show if it were going to.
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('UIC-TRUNCATION-TOOLTIP-1.4 closes on press and on Escape', async ({ page, lab }) => {
    await lab.open('truncation-tooltip');
    const cut = matrixCell(page, 'text=cut holder=plain').locator('.ui-truncation-tooltip');
    await cut.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.mouse.down();
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    await page.mouse.up();
    await page.mouse.move(0, 0);
    await cut.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
  });

  test('UIC-TRUNCATION-TOOLTIP-1.5 places the visual-only panel below the text', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const text = page.locator('[data-lab-text="below"]');
    await text.hover();
    const panel = page.getByRole('tooltip');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-placement', 'bottom');
    const textBox = await text.boundingBox();
    const panelBox = await panel.boundingBox();
    expect(panelBox?.y ?? 0).toBeGreaterThanOrEqual((textBox?.y ?? 0) + (textBox?.height ?? 0) - 1);
    await lab.expectAccessible();
  });

  test('UIC-TRUNCATION-TOOLTIP-2.1 shows cut text whole in place by keyboard and cuts it again', async ({
    page,
    lab,
  }) => {
    await lab.open('truncation-tooltip');
    const cell = matrixCell(page, 'expandable=cut');
    const text = cell.locator('.ui-truncation-tooltip');
    const more = cell.getByRole('button', { name: 'Show more' });
    await expect(matrixCell(page, 'expandable=whole').getByRole('button')).toHaveCount(0);
    const cutHeight = (await text.boundingBox())?.height ?? 0;
    expect(await text.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await more.focus();
    await page.keyboard.press('Enter');
    await expect(text).toHaveAttribute('data-expanded', 'true');
    const less = cell.getByRole('button', { name: 'Show less' });
    await expect(less).toBeFocused();
    await expect(less).toHaveAttribute('aria-expanded', 'true');
    expect((await text.boundingBox())?.height ?? 0).toBeGreaterThan(cutHeight * 2);
    await lab.expectAccessible();
    await page.keyboard.press('Enter');
    await expect(text).not.toHaveAttribute('data-expanded');
    await expect(cell.getByRole('button', { name: 'Show more' })).toBeFocused();
  });
});
