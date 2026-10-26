import { expect, test } from './fixtures.js';

test.describe('Four Side Property Strip lab', () => {
  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.1 lays the four sides out on one line in order', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const cell = page.locator('[data-lab-cell="state=unit layout=responsive"]');
    const sides = cell.locator('.ui-four-side-property-strip__side');
    await expect(sides).toHaveCount(4);
    await expect(sides.locator('.ui-property-strip-cell__letter')).toHaveText(['T', 'B', 'L', 'R']);
    const boxes = await sides.evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().toJSON() as DOMRect),
    );
    for (let index = 1; index < boxes.length; index += 1) {
      expect(boxes[index]?.x).toBeGreaterThan(boxes[index - 1]?.x ?? 0);
      expect(Math.round(boxes[index]?.y ?? 0)).toBe(Math.round(boxes[0]?.y ?? 0));
    }
    const left = cell.getByRole('textbox', { name: 'Margin unit responsive left' });
    await left.fill('24');
    await expect(left).toHaveValue('24');
    await expect(cell.getByRole('group', { name: 'Margins' })).toBeVisible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.2 keeps the row for a side name and hides it otherwise', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const filtered = page.locator('[data-lab-filtered]');
    const strip = filtered.locator('.ui-four-side-property-strip');
    await expect(strip).toBeVisible();
    await filtered.getByLabel('Query').fill('colour');
    await expect(strip).toBeHidden();
    await filtered.getByLabel('Query').fill('bottom');
    await expect(strip).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('four-side-property-strip', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.5 links opposite sides or all four from the toggle', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const pairs = page.locator('[data-lab-cell="link=pairs"]');
    const side = (area: typeof pairs, link: string, name: string) =>
      area.getByRole('textbox', { name: `Padding ${link} ${name}` });
    const toggle = pairs.getByRole('button', { name: 'Link opposite sides' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(pairs.locator('.ui-four-side-property-strip')).toHaveAttribute(
      'data-linked',
      'true',
    );
    await side(pairs, 'pairs', 'left').fill('20');
    await expect(side(pairs, 'pairs', 'right')).toHaveValue('20');
    await expect(side(pairs, 'pairs', 'top')).toHaveValue('8');

    const all = page.locator('[data-lab-cell="link=all"]');
    await side(all, 'all', 'bottom').fill('6');
    for (const name of ['top', 'left', 'right']) {
      await expect(side(all, 'all', name)).toHaveValue('6');
    }
    await lab.expectAccessible();
  });

  test('UIC-FOUR-SIDE-PROPERTY-STRIP-1.4 orders flow-relative sides by the reading direction', async ({
    page,
    lab,
  }) => {
    await lab.open('four-side-property-strip');
    const xOf = (direction: string, name: string) =>
      page
        .getByRole('textbox', { name: `Inset ${direction} ${name}` })
        .evaluate((element) => element.getBoundingClientRect().x);
    const rtl = page.locator('[data-lab-cell="direction=rtl"]');
    await expect(rtl.locator('.ui-property-strip-cell__letter')).toHaveText(['T', 'B', 'S', 'E']);
    expect(await xOf('rtl', 'inline-start')).toBeGreaterThan(await xOf('rtl', 'inline-end'));
    expect(await xOf('ltr', 'inline-start')).toBeLessThan(await xOf('ltr', 'inline-end'));
    await expect(rtl.locator('[data-side="inline-start"]')).toHaveCount(1);
    await lab.expectAccessible();
  });
});
