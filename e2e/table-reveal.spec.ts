import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

/** Whether the element lies inside the visible box of the scroller around it. */
async function isInView(element: Locator, scroller: Locator): Promise<boolean> {
  const [box, view] = await Promise.all([element.boundingBox(), scroller.boundingBox()]);
  if (!box || !view) return false;
  return (
    box.y >= view.y - 1 &&
    box.y + box.height <= view.y + view.height + 1 &&
    box.x >= view.x - 1 &&
    box.x + box.width <= view.x + view.width + 1
  );
}

test.describe('Table handle', () => {
  test('UIC-TABLE-19.1 UIC-TABLE-19.3 reveals an undrawn row of a virtualized table and focuses a cell', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const section = page.locator('[data-lab-section="Revealing rows by id"]');
    const table = section.getByRole('treegrid', { name: 'Stops' });
    const scroller = section.locator('[data-lab="reveal-virtualized"] .ui-table__scroll');
    const result = section.locator('[data-lab-output="Reveal result"]');
    await expect(table.getByRole('row', { name: /Stop 250\b/ })).toHaveCount(0);
    const reveal = section.getByRole('button', { name: 'Reveal stop 250' });
    await reveal.click();
    await expect(result).toHaveText('found');
    const row = table.getByRole('row', { name: /Stop 250\b/ });
    await expect(row).toBeVisible();
    expect(await isInView(row, scroller)).toBe(true);
    // Revealing leaves focus on the button that asked.
    await expect(reveal).toBeFocused();

    await section.getByRole('button', { name: 'Focus the note of stop 280' }).click();
    await expect(result).toHaveText('found');
    const cell = table.getByRole('row', { name: /Stop 280\b/ }).locator('[data-column="note"]');
    await expect(cell).toBeFocused();
    expect(await isInView(cell, scroller)).toBe(true);
    await page.keyboard.press('ArrowDown');
    await expect(
      table.getByRole('row', { name: /Stop 281\b/ }).locator('[data-column="note"]'),
    ).toBeFocused();

    await section.getByRole('button', { name: 'Reveal stop 1A' }).click();
    await expect(result).toHaveText('not found (collapsed)');
    await section.getByRole('button', { name: 'Reveal stop 999' }).click();
    await expect(result).toHaveText('not found (missing)');
    await lab.expectAccessible();
  });

  test('UIC-TABLE-19.1 scrolls a right-to-left table across to a focused cell', async ({
    page,
    lab,
  }) => {
    await lab.open('table');
    const section = page.locator('[data-lab-section="Revealing rows by id"]');
    const scroller = section.locator('[data-lab="reveal-rtl"]');
    await section.getByRole('button', { name: 'Focus the note of stop 40' }).click();
    await expect(section.locator('[data-lab-output="Right-to-left reveal result"]')).toHaveText(
      'found',
    );
    const cell = section
      .getByRole('grid', { name: 'Stops, right to left' })
      .getByRole('row', { name: /Stop 40\b/ })
      .locator('[data-column="note"]');
    await expect(cell).toBeFocused();
    expect(await isInView(cell, scroller)).toBe(true);
  });
});
