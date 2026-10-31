import { expect, test, matrixCell } from './fixtures.js';

test('UIC-ATTRIBUTION-1.4 aligns card names with the surrounding sentence', async ({
  page,
  lab,
}) => {
  await lab.open('attribution');
  for (const template of ['default', 'edited', 'person first']) {
    const difference = await matrixCell(page, `template=${template} person=card`).evaluate(
      (cell) => {
        const bottom = (selector: string) => {
          const node = cell.querySelector(selector);
          if (!node) throw new Error(`Missing ${selector}`);
          const range = document.createRange();
          range.selectNodeContents(node);
          return range.getBoundingClientRect().bottom;
        };
        return Math.abs(bottom('.ui-attribution__name') - bottom('.ui-attribution__time'));
      },
    );
    expect(difference).toBeLessThanOrEqual(0.5);
  }
});

test('UIC-PROSE-TABLE-2.5 pins the header from the first pixel of scrolling', async ({
  page,
  lab,
}) => {
  await lab.open('prose-table');
  const viewport = matrixCell(page, 'header=sticky').locator('.ui-scroll-region__viewport');
  await viewport.scrollIntoViewIfNeeded();
  const header = viewport.locator('thead th').first();
  const initial = (await header.boundingBox())?.y;
  expect(initial).toBeDefined();
  for (const top of [1, 4, 10, 80]) {
    await viewport.evaluate((node, value) => {
      node.scrollTop = value;
    }, top);
    await expect(async () => {
      expect((await header.boundingBox())?.y).toBeCloseTo(initial ?? 0, 1);
    }).toPass();
  }
});

test('UIC-MENU-5.3 keeps virtualized menus at a stable width', async ({ page, lab }) => {
  await lab.open('menu');
  for (const label of ['5000 cities', 'Tall rows']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    const menu = page.getByRole('menu', { name: label, exact: true });
    await expect(menu).toBeVisible();
    const widths = await menu.evaluate(async (node) => {
      const samples = [];
      for (let index = 0; index < 32; index++) {
        await new Promise(requestAnimationFrame);
        samples.push(node.getBoundingClientRect().width);
      }
      return samples;
    });
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    expect(Math.max(...widths)).toBeLessThanOrEqual(page.viewportSize()?.width ?? 0);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
  }
});

test('UIC-POPOVER-1.5 demonstrates start placement with and without an arrow', async ({
  page,
  lab,
}) => {
  await lab.open('popover');
  for (const arrow of ['no arrow', 'arrow']) {
    const trigger = matrixCell(page, `placement=start arrow=${arrow}`).getByRole('button', {
      name: 'Open start',
    });
    await trigger.click();
    const panel = page.locator(`[data-lab-popover="start-${arrow}"]`);
    await expect(panel).toHaveAttribute('data-placement', 'left');
    await expect(panel).not.toHaveAttribute('data-entering');
    const anchor = await trigger.boundingBox();
    const edge = await (
      arrow === 'arrow' ? panel.locator('.ui-popover__arrow') : panel
    ).boundingBox();
    if (!anchor || !edge) throw new Error('Missing popover geometry');
    const gap = anchor.x - edge.x - edge.width;
    expect(gap).toBeGreaterThanOrEqual(-0.5);
    expect(gap).toBeLessThanOrEqual(arrow === 'arrow' ? 1.5 : 9);
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  }
});
