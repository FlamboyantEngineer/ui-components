import { expect, test } from './fixtures.js';

test.describe('Tabs composition', () => {
  test('UIC-TABS-1.1 keeps hidden panels and their drafts mounted with shouldForceMount', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-case="force-mount"]');
    const tab = (name: string) => demo.getByRole('tab', { name });
    const mounts = demo.locator('[data-lab-output="mounts"]');
    await demo.getByRole('textbox', { name: 'Monday note' }).fill('Water the plants');
    await tab('Tuesday').click();
    await tab('Monday').click();
    await expect(demo.getByRole('textbox', { name: 'Monday note' })).toHaveValue('');
    await expect(mounts).toHaveText('Monday 2, Tuesday 1, Wednesday 0');

    await demo.getByRole('switch', { name: 'Keep hidden panels mounted' }).press('Space');
    await expect(mounts).toHaveText('Monday 1, Tuesday 1, Wednesday 1');
    await demo.getByRole('textbox', { name: 'Monday note' }).fill('Water the plants');
    await tab('Monday').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab('Tuesday')).toHaveAttribute('aria-selected', 'true');
    await expect(demo.locator('.ui-tabs__panel[inert]')).toHaveCount(2);
    await page.keyboard.press('ArrowLeft');
    await expect(demo.getByRole('textbox', { name: 'Monday note' })).toHaveValue(
      'Water the plants',
    );
    await expect(mounts).toHaveText('Monday 1, Tuesday 1, Wednesday 1');
    await lab.expectAccessible();
  });

  test('UIC-TABS-1.5 UIC-TABS-1.6 swaps every part, and reports context menus', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-case="composed"]');
    await expect(demo.locator('[data-lab-swapped="tabs"]')).toHaveAttribute(
      'data-lab-orientation',
      'horizontal',
    );
    await expect(demo.locator('[data-lab-swapped="list"]')).toHaveAttribute('role', 'tablist');
    const starred = demo.getByRole('tab', { name: 'Starred' });
    await expect(starred).toHaveAttribute('data-lab-swapped', 'tab');
    await expect(starred).toHaveAttribute('data-lab-selected', 'true');
    await expect(demo.locator('[data-lab-swapped="panel"]')).toHaveRole('tabpanel');

    await demo.getByRole('tab', { name: 'Shared' }).click();
    await expect(starred).toHaveAttribute('data-lab-selected', 'false');

    await demo.getByRole('tab', { name: 'Recent' }).click({ button: 'right' });
    await expect(demo.locator('[data-lab-output="context"]')).toHaveText('Recent');
    await starred.focus();
    await page.keyboard.press('Shift+F10');
    await expect(demo.locator('[data-lab-output="context"]')).toHaveText('Starred');
    await lab.expectAccessible();
  });

  test('UIC-TABS-2.6 lists an icon tab in the overflow menu by its text value', async ({
    page,
    lab,
  }) => {
    await lab.open('tabs');
    const demo = page.locator('[data-lab-case="text-value"]');
    await demo.getByRole('button', { name: /more items?$/ }).click();
    await page.getByRole('menuitem', { name: 'Starred' }).click();
    await expect(demo.getByRole('tab', { name: 'Starred' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(demo.getByRole('tabpanel')).toHaveText('The starred list.');
  });
});
