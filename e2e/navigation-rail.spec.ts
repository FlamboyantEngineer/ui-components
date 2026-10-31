import { expect, test } from './fixtures.js';

const stateRail = (rail: string, width: string) =>
  `[data-lab-cell="rail=${rail} width=${width}"] .ui-navigation-rail`;

test.describe('Navigation Rail lab', () => {
  test('UIC-NAVIGATION-RAIL-1.1 UIC-NAVIGATION-RAIL-2.1 UIC-NAVIGATION-RAIL-2.2 renders sections of links with the current page', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-rail');
    const rail = page.getByRole('navigation', { name: 'Navigation, expanded, fixed' });
    await expect(rail.getByRole('list', { name: 'Pinned' })).toBeVisible();
    const inbox = rail.getByRole('link', { name: 'Inbox 4' });
    await expect(inbox).toHaveAttribute('aria-current', 'page');
    await expect(inbox).toHaveAccessibleDescription('4 unread');
    await expect(inbox).toHaveAttribute('href', '#inbox');
    await rail.getByRole('link', { name: 'Weekly menu' }).click();
    await expect(rail.getByRole('link', { name: 'Weekly menu' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(inbox).not.toHaveAttribute('aria-current');
  });

  test('UIC-NAVIGATION-RAIL-2.3 caps counts and hides zero', async ({ page, lab }) => {
    await lab.open('navigation-rail');
    const items = page.getByRole('navigation', { name: 'Items, expanded' });
    await expect(items.getByRole('link', { name: 'Market days 99+' })).toBeVisible();
    await expect(items.getByRole('link', { name: 'Shared lists 7' })).toHaveAccessibleDescription(
      '7 items',
    );
    const rail = page.getByRole('navigation', { name: 'Navigation, expanded, fixed' });
    await expect(rail.getByRole('link', { name: 'Alerts' }).locator('.ui-badge')).toHaveCount(0);
    const collapsed = page.getByRole('navigation', { name: 'Items, collapsed' });
    await expect(
      collapsed.getByRole('link', { name: 'Shared lists 7' }).locator('.ui-badge'),
    ).toHaveAttribute('data-placement', 'overlay');
  });

  test('UIC-NAVIGATION-RAIL-1.2 UIC-NAVIGATION-RAIL-2.4 collapses to icons with tooltips and initials', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-rail');
    const rail = page.locator(stateRail('expanded', 'fixed'));
    const wide = (await rail.boundingBox())?.width ?? 0;
    const toggle = rail.getByRole('button', { name: 'Collapse navigation' });
    await toggle.click();
    await expect(rail).toHaveAttribute('data-collapsed', 'true');
    await expect(rail.getByRole('button', { name: 'Expand navigation' })).toBeFocused();
    await expect.poll(async () => (await rail.boundingBox())?.width ?? 0).toBeLessThan(wide);
    const plan = rail.getByRole('link', { name: 'Weekly menu' });
    await expect(plan.locator('.ui-navigation-rail__label')).toHaveClass(/ui-visually-hidden/);
    await page.mouse.move(600, 5);
    await plan.hover();
    await expect(page.getByRole('tooltip')).toHaveText('Weekly menu');
    const market = page
      .getByRole('navigation', { name: 'Items, collapsed' })
      .getByRole('link', { name: 'Market days 99+' });
    await expect(market.locator('.ui-navigation-rail__monogram')).toHaveText('MD');
  });

  test('UIC-NAVIGATION-RAIL-2.5 UIC-NAVIGATION-RAIL-2.6 opens groups, marks the one holding the current page, and expands a collapsed rail', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-rail');
    const rail = page.getByRole('navigation', { name: 'Navigation, expanded, fixed' });
    const recipes = rail.getByRole('button', { name: 'Recipes' });
    await expect(recipes).toHaveAttribute('aria-expanded', 'false');
    await recipes.click();
    await rail.getByRole('button', { name: 'Desserts' }).click();
    await rail.getByRole('link', { name: 'Tarts 99+' }).click();
    await expect(rail.locator('.ui-navigation-rail__item[data-current]')).toHaveCount(3);
    await expect(recipes.locator('xpath=ancestor::li[1]')).toHaveAttribute('data-current', 'true');

    const collapsed = page.locator(stateRail('collapsed', 'fixed'));
    const group = collapsed.getByRole('button', { name: 'Recipes' });
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await group.click();
    await expect(collapsed).not.toHaveAttribute('data-collapsed');
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(collapsed.getByRole('link', { name: 'Breakfast' })).toBeVisible();
  });

  test('UIC-NAVIGATION-RAIL-1.5 moves focus with the arrow keys', async ({ page, lab }) => {
    await lab.open('navigation-rail');
    const rail = page.getByRole('navigation', { name: 'Navigation, expanded, fixed' });
    await rail.getByRole('link', { name: 'Weekly menu' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(rail.getByRole('link', { name: 'Pantry' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(rail.getByRole('link', { name: 'Alerts' })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(rail.getByRole('link', { name: 'Profile' })).toBeFocused();
    await page.keyboard.press('Home');
    await expect(rail.getByRole('link', { name: 'Weekly menu' })).toBeFocused();
  });

  test('UIC-NAVIGATION-RAIL-1.3 UIC-NAVIGATION-RAIL-1.4 resizes and keeps the state across reloads', async ({
    page,
    lab,
  }) => {
    await lab.open('navigation-rail');
    const demo = page.locator('[data-lab-demo="workspace"]');
    const rail = demo.getByRole('navigation', { name: 'Kitchen navigation' });
    const handle = rail.getByRole('separator', { name: 'Resize navigation' });
    await expect(handle).toHaveAttribute('aria-valuenow', '240');
    await handle.scrollIntoViewIfNeeded();
    const box = await handle.boundingBox();
    if (!box) throw new Error('The resize handle has no box');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 4 });
    await expect(rail).toHaveAttribute('data-resizing', 'true');
    await page.mouse.up();
    await expect(demo.locator('[data-lab-width]')).toHaveText('Resized to 300px');
    await expect.poll(async () => (await rail.boundingBox())?.width).toBe(300);
    await handle.focus();
    await page.keyboard.press('ArrowLeft');
    await expect(demo.locator('[data-lab-width]')).toHaveText('Resized to 280px');
    await rail.getByRole('button', { name: 'Collapse navigation' }).click();
    await expect(rail.getByRole('separator')).toHaveCount(0);

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-lab-ready', 'true');
    const reloaded = page.getByRole('navigation', { name: 'Kitchen navigation' });
    await expect(reloaded).toHaveAttribute('data-collapsed', 'true');
    await reloaded.getByRole('button', { name: 'Expand navigation' }).click();
    await expect(reloaded.getByRole('separator')).toHaveAttribute('aria-valuenow', '280');
  });

  test('UIC-NAVIGATION-RAIL-3.1 passes axe', async ({ page, lab }) => {
    await lab.open('navigation-rail');
    await expect(page.locator('#lab-root .ui-navigation-rail').first()).toBeAttached();
    await lab.expectAccessible();
  });
});
