import type { Locator } from '@playwright/test';
import { cellSelector, expect, matrixCell, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('element has no box');
  return rect;
}

test.describe('Separator lab', () => {
  test('UIC-SEPARATOR-1.1 UIC-SEPARATOR-1.2 UIC-SEPARATOR-1.3 UIC-SEPARATOR-3.1 draws rules across and between content in three line styles', async ({
    page,
    lab,
  }) => {
    await lab.open('separator');
    const cell = (orientation: string, variant: string) =>
      matrixCell(page, `orientation=${orientation} variant=${variant}`);
    for (const variant of ['solid', 'dashed', 'dotted']) {
      const horizontal = cell('horizontal', variant).getByRole('separator');
      await expect(horizontal).toHaveAttribute('data-variant', variant);
      await expect(horizontal).toHaveAttribute('data-orientation', 'horizontal');
      await expect(horizontal).not.toHaveAttribute('aria-orientation');
      expect(await horizontal.evaluate((node) => node.tagName)).toBe('HR');
      const rule = await box(horizontal);
      const above = await box(cell('horizontal', variant).getByText('Apples'));
      const below = await box(cell('horizontal', variant).getByText('Pears'));
      expect(rule.width).toBe(200);
      expect(rule.height).toBe(1);
      expect(rule.y).toBeGreaterThan(above.y + above.height);
      expect(rule.y + rule.height).toBeLessThan(below.y);

      const vertical = cell('vertical', variant).getByRole('separator');
      await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
      expect(await vertical.evaluate((node) => node.tagName)).toBe('DIV');
      const line = await box(vertical);
      const start = await box(cell('vertical', variant).getByText('Apples'));
      const end = await box(cell('vertical', variant).getByText('Pears'));
      expect(line.width).toBe(1);
      expect(line.height).toBeGreaterThanOrEqual(16);
      expect(line.x).toBeGreaterThan(start.x + start.width);
      expect(line.x + line.width).toBeLessThan(end.x);
    }
    const dashed = cell('horizontal', 'dashed').getByRole('separator');
    expect(await dashed.evaluate((node) => getComputedStyle(node).borderTopStyle)).toBe('dashed');
    const dotted = cell('vertical', 'dotted').getByRole('separator');
    expect(await dotted.evaluate((node) => getComputedStyle(node).borderLeftStyle)).toBe('dotted');
  });

  test('UIC-SEPARATOR-2.1 UIC-SEPARATOR-2.2 UIC-SEPARATOR-3.2 lays a line on each side of a label that names the separator', async ({
    page,
    lab,
  }) => {
    await lab.open('separator');
    const parts = async (selector: string) => {
      const rule = page.locator(selector).getByRole('separator', { name: 'Desserts' });
      await expect(rule).toHaveAttribute('aria-labelledby', /.+/);
      return {
        rule,
        start: await box(rule.locator('.ui-separator__start-line')),
        label: await box(rule.locator('.ui-separator__label')),
        end: await box(rule.locator('.ui-separator__end-line')),
      };
    };
    const center = await parts(cellSelector('variant=solid labelPosition=center'));
    await expect(center.rule).toHaveAttribute('data-label-position', 'center');
    expect(center.start.x + center.start.width).toBeLessThanOrEqual(center.label.x);
    expect(center.label.x + center.label.width).toBeLessThanOrEqual(center.end.x);
    expect(Math.abs(center.start.width - center.end.width)).toBeLessThanOrEqual(1);
    expect(center.start.height).toBe(1);

    const start = await parts(cellSelector('variant=dashed labelPosition=start'));
    expect(start.start.width).toBe(12);
    expect(start.end.width).toBeGreaterThan(start.start.width * 4);
    expect(
      await start.rule
        .locator('.ui-separator__end-line')
        .evaluate((node) => getComputedStyle(node).borderTopStyle),
    ).toBe('dashed');

    const end = await parts(cellSelector('variant=dotted labelPosition=end'));
    expect(end.end.width).toBe(12);
    expect(end.start.width).toBeGreaterThan(end.end.width * 4);

    const vertical = matrixCell(page, 'labelPosition=center').getByRole('separator', {
      name: 'or',
    });
    await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    const top = await box(vertical.locator('.ui-separator__start-line'));
    const label = await box(vertical.locator('.ui-separator__label'));
    const bottom = await box(vertical.locator('.ui-separator__end-line'));
    expect(top.width).toBe(1);
    expect(top.y + top.height).toBeLessThanOrEqual(label.y);
    expect(label.y + label.height).toBeLessThanOrEqual(bottom.y);
    expect(top.height).toBeGreaterThan(20);
  });

  test('UIC-SEPARATOR-1.3 draws a wiggly line along either axis', async ({ page, lab }) => {
    await lab.open('separator');
    const horizontal = matrixCell(page, 'orientation=horizontal variant=wiggly').getByRole(
      'separator',
    );
    const across = await box(horizontal);
    expect(across.width).toBe(200);
    expect(across.height).toBe(6);
    expect(await horizontal.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain(
      'radial-gradient',
    );
    const vertical = matrixCell(page, 'orientation=vertical variant=wiggly').getByRole('separator');
    const down = await box(vertical);
    expect(down.width).toBe(6);
    expect(down.height).toBeGreaterThanOrEqual(16);
    const line = matrixCell(page, 'variant=wiggly labelPosition=center').locator(
      '.ui-separator__start-line',
    );
    expect((await box(line)).height).toBe(6);
  });

  test('UIC-SEPARATOR-1.3 draws a labelled wiggly separator on its lines only, clear of its label', async ({
    page,
    lab,
  }) => {
    await lab.open('separator');
    const rules = [
      ...['start', 'center', 'end'].map((position) =>
        matrixCell(page, `variant=wiggly labelPosition=${position}`),
      ),
      ...['horizontal', 'vertical'].flatMap((orientation) =>
        ['across', 'before', 'after'].map((placement) =>
          matrixCell(page, `variant=wiggly orientation=${orientation} placement=${placement}`),
        ),
      ),
    ].map((cell) => cell.getByRole('separator'));
    for (const rule of rules) {
      const root = await rule.evaluate((node) => {
        const style = getComputedStyle(node);
        return { mask: style.maskImage, background: style.backgroundImage };
      });
      expect(root).toEqual({ mask: 'none', background: 'none' });
      const label = await box(rule.locator('.ui-separator__label'));
      const lines = rule.locator(':is(.ui-separator__start-line, .ui-separator__end-line)');
      for (const line of await lines.all()) {
        if (!(await line.isVisible())) continue;
        expect(await line.evaluate((node) => getComputedStyle(node).backgroundImage)).toContain(
          'radial-gradient',
        );
        const drawn = await box(line);
        const apart =
          drawn.x + drawn.width <= label.x ||
          label.x + label.width <= drawn.x ||
          drawn.y + drawn.height <= label.y ||
          label.y + label.height <= drawn.y;
        expect(apart).toBe(true);
      }
    }
  });

  test('UIC-SEPARATOR-2.3 sets a label before or after an unbroken line, aligned by its position', async ({
    page,
    lab,
  }) => {
    await lab.open('separator');
    const parts = async (name: string, cell: string) => {
      const rule = matrixCell(page, cell).getByRole('separator', { name });
      return {
        rule,
        line: await box(rule.locator('.ui-separator__start-line')),
        label: await box(rule.locator('.ui-separator__label')),
        endLine: rule.locator('.ui-separator__end-line'),
      };
    };

    const above = await parts('Desserts', 'orientation=horizontal placement=before align=start');
    await expect(above.rule).toHaveAttribute('data-label-placement', 'before');
    await expect(above.endLine).toBeHidden();
    expect(above.line.width).toBe(200);
    expect(above.label.y + above.label.height).toBeLessThanOrEqual(above.line.y);
    expect(above.label.x).toBe(above.line.x);

    const below = await parts('Desserts', 'orientation=horizontal placement=after align=end');
    expect(below.line.width).toBe(200);
    expect(below.label.y).toBeGreaterThanOrEqual(below.line.y + below.line.height);
    expect(below.label.x + below.label.width).toBeCloseTo(below.line.x + below.line.width, 0);

    const centred = await parts('Desserts', 'orientation=horizontal placement=after align=center');
    const middle = centred.label.x + centred.label.width / 2;
    expect(Math.abs(middle - (centred.line.x + centred.line.width / 2))).toBeLessThanOrEqual(1);

    const before = await parts('or', 'orientation=vertical placement=before align=start');
    await expect(before.rule).toHaveAttribute('aria-orientation', 'vertical');
    expect(before.label.x + before.label.width).toBeLessThanOrEqual(before.line.x);
    expect(before.label.y).toBe(before.line.y);
    expect(before.line.height).toBeGreaterThan(100);

    const after = await parts('or', 'orientation=vertical placement=after align=end');
    expect(after.label.x).toBeGreaterThanOrEqual(after.line.x + after.line.width);
    expect(after.label.y + after.label.height).toBeCloseTo(after.line.y + after.line.height, 0);

    const across = await parts('or', 'orientation=vertical placement=across align=center');
    expect(across.line.y + across.line.height).toBeLessThanOrEqual(across.label.y);
    await expect(across.endLine).toBeVisible();

    const rtlBefore = await parts('or', 'direction=rtl orientation=vertical placement=before');
    expect(rtlBefore.label.x).toBeGreaterThanOrEqual(rtlBefore.line.x + rtlBefore.line.width);
    const rtlAbove = await parts(
      'Desserts',
      'direction=rtl orientation=horizontal placement=before',
    );
    expect(rtlAbove.label.x + rtlAbove.label.width).toBeCloseTo(
      rtlAbove.line.x + rtlAbove.line.width,
      0,
    );
    expect(rtlAbove.label.y + rtlAbove.label.height).toBeLessThanOrEqual(rtlAbove.line.y);
    await lab.expectAccessible();
  });

  test('UIC-SEPARATOR-3.3 keeps separators out of the tab sequence', async ({ page, lab }) => {
    await lab.open('separator');
    const demo = page.locator('[data-lab-demo="sign-in"]');
    await demo.getByRole('button', { name: 'Continue with email' }).focus();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('button', { name: 'Continue with a passkey' })).toBeFocused();
    expect(await page.locator('#lab-root .ui-separator[tabindex]').count()).toBe(0);
    await expect(demo.getByRole('separator', { name: 'or' })).toBeVisible();
  });

  test('UIC-SEPARATOR-3.4 draws decorative rules that assistive technology passes over', async ({
    page,
    lab,
  }) => {
    await lab.open('separator');
    const cell = (kind: string, content: string) =>
      matrixCell(page, `kind=${kind} content=${content}`);
    await expect(cell('separator', 'plain').getByRole('separator')).toHaveCount(1);
    await expect(cell('decorative', 'plain').getByRole('separator')).toHaveCount(0);
    const decorative = cell('decorative', 'labelled').locator('.ui-separator');
    await expect(decorative).toHaveAttribute('role', 'none');
    await expect(cell('decorative', 'labelled').getByRole('separator')).toHaveCount(0);
    await expect(cell('decorative', 'labelled').getByText('Pastry')).toBeVisible();
    expect((await box(cell('decorative', 'plain').locator('.ui-separator'))).height).toBe(1);
    await expect(
      page.locator('[data-lab-demo="recipe"] li .ui-separator[data-variant="dotted"]'),
    ).toHaveAttribute('role', 'none');
    await lab.expectAccessible();
  });

  test('UIC-SEPARATOR-4.1 underlies toolbar row and menu separators without changing their look', async ({
    page,
    lab,
  }) => {
    await lab.open('separator');
    const demo = page.locator('[data-lab-demo="composed"]');
    const toolbarRule = demo.locator('.ui-toolbar-row__separator');
    await expect(toolbarRule).toHaveClass(/ui-separator/);
    await expect(toolbarRule).toHaveAttribute('aria-orientation', 'vertical');
    const rule = await box(toolbarRule);
    const copy = await box(demo.getByRole('button', { name: 'Copy' }));
    expect(rule.width).toBe(1);
    expect(rule.x).toBeGreaterThan(copy.x + copy.width);
    const menuRule = demo.locator('.ui-menu-separator');
    await expect(menuRule).toHaveClass(/ui-separator/);
    await expect(menuRule).toHaveAttribute('data-orientation', 'horizontal');
    expect((await box(menuRule)).height).toBe(1);
    await demo.getByRole('button', { name: 'Copy' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(demo.getByRole('button', { name: 'Undo' })).toBeFocused();
    await lab.expectAccessible();
  });
});
