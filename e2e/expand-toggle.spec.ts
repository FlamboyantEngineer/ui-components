import { expect, familySelector, matrixCell, test } from './fixtures.js';

test.describe('Expand Toggle lab', () => {
  test('UIC-EXPAND-TOGGLE-1.5 gives a leaf the toggle box at every size', async ({ page, lab }) => {
    await lab.open('expand-toggle');
    for (const [size, edge] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const toggle = await matrixCell(page, `state=collapsed size=${size}`)
        .locator(`.ui-expand-toggle`)
        .boundingBox();
      const leaf = await matrixCell(page, `state=leaf size=${size}`)
        .locator(`.ui-expand-toggle`)
        .boundingBox();
      expect(toggle?.width).toBe(edge);
      expect(leaf?.width).toBe(edge);
      expect(leaf?.height).toBe(edge);
    }
  });

  test('UIC-EXPAND-TOGGLE-1.1 UIC-EXPAND-TOGGLE-1.3 UIC-EXPAND-TOGGLE-1.5 expands a row without opening it and keeps leaves aligned', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const tree = page.locator('[data-lab-case="tree"]');
    const citrus = tree.locator('[data-lab-row="Citrus"]');
    const toggle = citrus.getByRole('button', { name: 'Expand' });
    await toggle.click();
    await expect(citrus.getByRole('button', { name: 'Collapse' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await expect(tree.locator('[data-lab-row="Lemon"]')).toBeVisible();
    await expect(tree.locator('[data-lab-output="opened"]')).toHaveText('none');
    await citrus.getByText('Citrus').click();
    await expect(tree.locator('[data-lab-output="opened"]')).toHaveText('Citrus');

    const citrusLabel = await citrus.getByText('Citrus').boundingBox();
    const bananaLabel = await tree
      .locator('[data-lab-row="Banana"]')
      .getByText('Banana')
      .boundingBox();
    expect(bananaLabel?.x).toBe(citrusLabel?.x);
  });

  test('UIC-EXPAND-TOGGLE-1.4 toggles from the keyboard and stays accessible', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const berries = page.locator('[data-lab-row="Berries"]');
    await berries.getByRole('button', { name: 'Expand' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-row="Strawberry"]')).toBeVisible();
    await page.keyboard.press(' ');
    await expect(page.locator('[data-lab-row="Strawberry"]')).toHaveCount(0);
    await expect(matrixCell(page, 'state=disabled size=md').getByRole('button')).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-EXPAND-TOGGLE-1.7 triggers a React Aria disclosure panel', async ({ page, lab }) => {
    await lab.open('expand-toggle');
    const demo = page.locator('[data-lab-case="disclosure"]');
    const toggle = demo.getByRole('button', { name: 'Citrus details' });
    const panel = demo.getByText('Lemon, orange and lime grow in warm climates.');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toBeHidden();
    const controls = await toggle.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAttribute('data-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(page.locator(`[id="${controls}"]`)).toContainText('Lemon');
    await lab.expectAccessible();
  });

  test('UIC-EXPAND-TOGGLE-1.7 stays disabled and silent in a disabled disclosure', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const demo = page.locator('[data-lab-case="disabled-disclosure"]');
    const toggle = demo.getByRole('button', { name: 'Berry details' });
    const output = demo.locator('[data-lab-output]');
    await expect(toggle).toBeDisabled();
    await toggle.click({ force: true });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(output).toHaveText('Reported 0 changes');
    await demo.getByRole('button', { name: 'Enable the disclosure' }).click();
    await expect(toggle).toBeEnabled();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(output).toHaveText('Reported 1 changes');
  });

  test('UIC-EXPAND-TOGGLE-1.8 shows a busy indicator while children load', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const demo = page.locator('[data-lab-case="lazy"]');
    const toggle = demo.locator('.ui-expand-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('data-pending', 'true');
    await expect(demo.getByRole('progressbar', { name: 'Loading stone fruit' })).toBeVisible();
    await expect(toggle).toBeFocused();
    await demo.locator('[data-lab-action="finish"]').click();
    await expect(toggle).not.toHaveAttribute('data-pending');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(demo.getByRole('listitem')).toHaveText(['Cherry', 'Peach', 'Plum']);
    await lab.expectAccessible();
  });

  test('UIC-EXPAND-TOGGLE-1.9 draws a custom glyph or the chevron with a tooltip and the same name', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const family = { family: 'expand-toggle-host-cases' };
    const path = (address: string) =>
      matrixCell(page, address, family).locator('svg path').first().getAttribute('d');
    const chevron = await path('icon=chevron state=collapsed');
    const folder = await path('icon=folder state=collapsed');
    expect(folder).not.toBe(chevron);
    expect(await path('icon=folder state=expanded')).toBe(folder);
    expect(await path('icon=no icon (null) state=collapsed')).toBe(chevron);
    const expanded = matrixCell(page, 'icon=folder state=expanded', family).getByRole('button');
    await expect(expanded).toHaveAccessibleName('Collapse');
    await expect(expanded).toHaveAttribute('aria-expanded', 'true');
    await expanded.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Show the varieties');
  });

  test('UIC-EXPAND-TOGGLE-1.4 leaves Tab to a row that toggles with the arrows', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const demo = page.locator('[data-lab-case="tab-owning-row"]');
    const row = demo.getByRole('group', { name: 'Citrus' });
    const toggle = row.getByRole('button', { name: 'Expand' });
    await expect(toggle).toHaveAttribute('tabindex', '-1');
    await row.focus();
    await page.keyboard.press('Tab');
    await expect(toggle).not.toBeFocused();
    await row.focus();
    await page.keyboard.press('ArrowRight');
    await expect(demo.getByText('Lemon')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Collapse' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(demo.getByText('Lemon')).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="row-opened"]')).toHaveText('1');
    await row.getByRole('button', { name: 'Expand' }).click();
    await expect(demo.getByText('Lemon')).toBeVisible();
    await expect(demo.locator('[data-lab-output="row-opened"]')).toHaveText('1');
  });

  test('UIC-EXPAND-TOGGLE-1.3 UIC-EXPAND-TOGGLE-1.9 renders a swapped root that keeps presses off the row', async ({
    page,
    lab,
  }) => {
    await lab.open('expand-toggle');
    const demo = page.locator('[data-lab-case="swapped-toggle"]');
    const toggle = demo.getByRole('button', { name: 'Expand' });
    await expect(toggle).toHaveAttribute('data-lab-swapped', 'true');
    await expect(toggle).toHaveClass(/ui-expand-toggle/);
    await toggle.hover();
    await expect(toggle).toHaveAttribute('data-lab-hovered', 'true');
    await toggle.click();
    await expect(demo.getByText('Strawberry')).toBeVisible();
    await expect(demo.locator('[data-lab-output="row-opened"]')).toHaveText('0');
    await demo.getByText('Berries').click();
    await expect(demo.locator('[data-lab-output="row-opened"]')).toHaveText('1');
    await lab.expectAccessible(familySelector('expand-toggle-host-cases'));
  });
});
