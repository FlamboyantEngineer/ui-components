import { cellSelector, expect, test } from './fixtures.js';

test.describe('Button Group lab', () => {
  test('UIC-BUTTON-GROUP-1.1 UIC-BUTTON-GROUP-1.2 joins attached buttons and spaces the others', async ({
    page,
    lab,
  }) => {
    await lab.open('button-group');
    const cell = (density: string, orientation: string) =>
      page.locator(
        `${cellSelector(`density=${density} orientation=${orientation}`)} .ui-button-group`,
      );
    const gapBetween = async (density: string) => {
      const buttons = cell(density, 'horizontal').first().locator('.ui-button');
      const first = await buttons.nth(0).boundingBox();
      const second = await buttons.nth(1).boundingBox();
      return (second?.x ?? 0) - ((first?.x ?? 0) + (first?.width ?? 0));
    };
    expect(await gapBetween('default')).toBeCloseTo(8, 0);
    expect(await gapBetween('compact')).toBeCloseTo(2, 0);
    expect(await gapBetween('attached')).toBeCloseTo(-1, 0);
    const group = page.getByRole('group', { name: 'Alignment attached horizontal' });
    await expect(group).toHaveAttribute('data-density', 'attached');
    await lab.expectAccessible();
  });

  test('UIC-BUTTON-GROUP-1.1 UIC-BUTTON-GROUP-1.3 stacks a vertical group and keeps every tab stop', async ({
    page,
    lab,
  }) => {
    await lab.open('button-group');
    const group = page.getByRole('group', { name: 'History attached vertical' });
    const undo = group.getByRole('button', { name: 'Undo' });
    const redo = group.getByRole('button', { name: 'Redo' });
    const undoBox = await undo.boundingBox();
    const redoBox = await redo.boundingBox();
    expect(redoBox?.y ?? 0).toBeGreaterThan(undoBox?.y ?? 0);
    expect(redoBox?.x).toBeCloseTo(undoBox?.x ?? 0, 0);
    await undo.focus();
    await page.keyboard.press('Tab');
    await expect(redo).toBeFocused();
    await expect(group).toHaveAttribute('data-focus-visible', 'true');
    await page.keyboard.press('Tab');
    await expect(group.getByRole('button', { name: 'More history' })).toBeFocused();
  });

  test('UIC-BUTTON-GROUP-1.2 keeps a selected attached button above its neighbours at rest', async ({
    page,
    lab,
  }) => {
    await lab.open('button-group');
    await page.mouse.move(0, 0);
    // The topmost element at the middle of each edge a selected button shares is that button.
    const covered = await page.evaluate(() => {
      const problems: string[] = [];
      const groups = document.querySelectorAll<HTMLElement>(
        '[data-lab-section="Selected on a shared edge"] .ui-button-group',
      );
      for (const group of groups) {
        group.scrollIntoView({ block: 'center', inline: 'center' });
        const buttons = [...group.querySelectorAll<HTMLElement>('.ui-button')];
        const selected = buttons.findIndex((button) => button.hasAttribute('data-selected'));
        const box = buttons[selected]?.getBoundingClientRect();
        if (!box) continue;
        const isVertical = group.dataset['orientation'] === 'vertical';
        for (const neighbour of [buttons[selected - 1], buttons[selected + 1]]) {
          if (!neighbour) continue;
          const other = neighbour.getBoundingClientRect();
          const point = isVertical
            ? [box.left + box.width / 2, other.top < box.top ? box.top + 0.5 : box.bottom - 0.5]
            : [other.left < box.left ? box.left + 0.5 : box.right - 0.5, box.top + box.height / 2];
          const hit = document.elementFromPoint(point[0] ?? 0, point[1] ?? 0);
          if (!buttons[selected]?.contains(hit))
            problems.push(group.getAttribute('aria-label') ?? '');
        }
      }
      return { problems, groups: groups.length };
    });
    expect(covered.groups).toBe(12);
    expect(covered.problems).toEqual([]);
  });

  test('UIC-BUTTON-GROUP-1.3 shares the width of a justified group', async ({ page, lab }) => {
    await lab.open('button-group');
    const buttons = page.locator('[data-lab-case="justified"] .ui-button');
    const widths = await buttons.evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().width),
    );
    expect(widths).toHaveLength(3);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1.5);
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeGreaterThan(355);
  });
});
