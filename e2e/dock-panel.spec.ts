import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

function inspector(page: Page) {
  return page.getByRole('region', { name: 'Inspector', exact: true });
}

test.describe('Dock Panel lab', () => {
  test('UIC-DOCK-PANEL-1.1 UIC-DOCK-PANEL-1.2 UIC-DOCK-PANEL-3.1 docks the panel with launchers on the outer edge', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = inspector(page);
    const frame = await box(page.locator('[data-lab-frame="workspace"]'));
    const rect = await box(panel);
    expect(rect.width).toBe(320);
    expect(Math.round(rect.x + rect.width)).toBe(Math.round(frame.x + frame.width));
    const toolbar = page.getByRole('toolbar', { name: 'Inspector panes' });
    await expect(toolbar).toHaveAttribute('aria-orientation', 'vertical');
    const rail = await box(toolbar);
    const separator = page.getByRole('separator', { name: 'Resize Inspector' });
    const handle = await box(separator);
    expect(rail.x).toBeGreaterThan(handle.x);
    // The separator starts right inside the panel's inner border.
    expect(Math.abs(handle.x - rect.x)).toBeLessThanOrEqual(1);
    await expect(panel.locator('.ui-dock-panel__count').first()).toHaveText('3');
    await expect(panel.locator('.ui-dock-panel__count').nth(1)).toHaveText('99+');
    await expect(page.getByRole('region', { name: 'Properties' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Report.pdf' })).toBeVisible();

    const start = page.locator('[data-lab-cell="position=start state=expanded"]');
    const startPanel = await box(start.locator('.ui-dock-panel'));
    const startMain = await box(start.getByText('Main'));
    expect(startPanel.x).toBeLessThan(startMain.x);
    const bottom = page.locator('[data-lab-cell="position=bottom state=expanded"]');
    const bottomPanel = await box(bottom.locator('.ui-dock-panel'));
    expect(bottomPanel.height).toBe(120);
    expect(bottomPanel.y).toBeGreaterThan((await box(bottom.getByText('Main'))).y);
    await lab.expectAccessible();
  });

  test('UIC-DOCK-PANEL-2.2 UIC-DOCK-PANEL-2.3 UIC-DOCK-PANEL-2.4 opens panes from the keyboard and keeps hidden panes mounted', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = inspector(page);
    const properties = panel.getByRole('button', { name: 'Properties', exact: true });
    await properties.focus();
    await page.keyboard.press('ArrowDown');
    const search = panel.getByRole('button', { name: 'Search', exact: true });
    await expect(search).toBeFocused();
    await page.keyboard.press('Enter');
    const searchPane = page.getByRole('region', { name: 'Search' });
    await expect(searchPane).toBeFocused();
    await expect(search).toHaveAttribute('aria-expanded', 'true');
    await page.locator('[data-lab-input="search"]').fill('budget');

    await panel.getByRole('button', { name: 'People', exact: true }).click();
    await expect(searchPane).toBeHidden();
    await expect(page.getByRole('region', { name: 'People' })).toBeVisible();
    await search.click();
    await expect(page.locator('[data-lab-input="search"]')).toHaveValue('budget');

    await search.click();
    await expect(panel).not.toHaveAttribute('data-expanded');
    await expect(search).toBeFocused();
    expect((await box(panel)).width).toBeLessThan(80);
    await expect(page.locator('[data-lab-output="workspace"]')).toHaveText('collapsed');
    await panel.getByRole('button', { name: 'Expand Inspector' }).click();
    await expect(panel).toHaveAttribute('data-expanded', 'true');
    await expect(searchPane).toBeVisible();
  });

  test('UIC-DOCK-PANEL-3.1 UIC-DOCK-PANEL-3.2 resizes from the inner edge by keyboard and pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    const panel = inspector(page);
    const separator = page.getByRole('separator', { name: 'Resize Inspector' });
    await expect(separator).toHaveAttribute('aria-valuemax', '460');
    await separator.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(separator).toHaveAttribute('aria-valuenow', '330');
    expect((await box(panel)).width).toBe(330);
    await page.keyboard.press('End');
    expect((await box(panel)).width).toBe(460);
    await page.keyboard.press('Home');
    expect((await box(panel)).width).toBe(200);

    const handle = await box(separator);
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 60, y, { steps: 4 });
    await expect(panel).toHaveAttribute('data-resizing', 'true');
    await page.mouse.up();
    await expect(panel).not.toHaveAttribute('data-resizing');
    await expect(separator).toHaveAttribute('aria-valuenow', '260');
    expect((await box(panel)).width).toBe(260);

    const console = page.getByRole('separator', { name: 'Resize Console' });
    await expect(console).toHaveAttribute('aria-orientation', 'horizontal');
    await console.focus();
    await page.keyboard.press('ArrowUp');
    expect((await box(page.getByRole('region', { name: 'Console', exact: true }))).height).toBe(
      160,
    );
  });

  test('UIC-DOCK-PANEL-3.3 restores the selection and size after a reload', async ({
    page,
    lab,
  }) => {
    await lab.open('dock-panel');
    await inspector(page).getByRole('button', { name: 'Activity', exact: true }).click();
    const separator = page.getByRole('separator', { name: 'Resize Inspector' });
    await separator.focus();
    await page.keyboard.press('End');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    await expect(page.getByRole('region', { name: 'Activity' })).toBeVisible();
    expect((await box(inspector(page))).width).toBe(460);
  });

  test('UIC-DOCK-PANEL-2.1 UIC-DOCK-PANEL-2.2 follows controlled values', async ({ page, lab }) => {
    await lab.open('dock-panel');
    const output = page.locator('[data-lab-output="controlled"]');
    await page.getByRole('button', { name: 'Show history' }).click();
    await expect(page.getByRole('region', { name: 'History' })).toBeVisible();
    await expect(output).toHaveText('history, expanded, 260px');
    await page.getByRole('button', { name: 'Collapse from outside' }).click();
    await expect(page.getByRole('region', { name: 'History' })).toBeHidden();
    await page.getByRole('button', { name: 'Outline', exact: true }).click();
    await expect(output).toHaveText('outline, expanded, 260px');
  });

  test('UIC-DOCK-PANEL-4.1 opens a pane in a drawer on a narrow frame', async ({ page, lab }) => {
    await lab.open('dock-panel');
    const panel = page.getByRole('region', { name: 'Helper', exact: true });
    await expect(panel).toHaveAttribute('data-overlay', 'true');
    await expect(panel.locator('.ui-dock-panel__body')).toHaveCount(0);
    const tips = panel.getByRole('button', { name: 'Tips', exact: true });
    await expect(tips).toHaveAttribute('aria-haspopup', 'dialog');
    await tips.click();
    const dialog = page.getByRole('dialog', { name: 'Tips' });
    await expect(dialog).toBeVisible();
    const drawer = page.locator('.ui-dock-panel__drawer');
    await expect(drawer).not.toHaveAttribute('data-entering');
    await expect(dialog).toBeFocused();
    await expect(dialog.getByText('Press a launcher to open its pane in a drawer.')).toBeVisible();
    await lab.expectAccessible('.ui-dock-panel__drawer');
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveCount(0);
    await expect(tips).toBeFocused();
    await expect(tips).toHaveAttribute('aria-expanded', 'false');
  });
});
