import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-view-switcher`;

test.describe('View Switcher lab', () => {
  test('UIC-VIEW-SWITCHER-1.1 UIC-VIEW-SWITCHER-1.3 UIC-VIEW-SWITCHER-1.8 shows views as tabs or a menu', async ({
    page,
    lab,
  }) => {
    await lab.open('view-switcher');
    const tabs = page.locator(cell('state=modified variant=tabs'));
    await expect(tabs.locator('.ui-view-switcher__label')).toHaveText([
      'All recipes',
      'Quick meals',
      'My recipes',
    ]);
    await expect(tabs).toHaveAttribute('data-dirty', 'true');
    await expect(tabs.getByRole('tab').first()).toHaveAccessibleName(
      'All recipes Default view Modified',
    );
    await expect(tabs.locator('.ui-view-switcher__modified')).toBeVisible();
    await expect(tabs.locator('.ui-view-switcher__default .ui-glyph')).toBeVisible();
    const menu = page.locator(cell('state=saved variant=menu'));
    await expect(menu.getByRole('tab')).toHaveCount(0);
    await expect(menu.locator('.ui-view-switcher__menu')).toHaveAccessibleName(
      'All recipes Default view',
    );
  });

  test('UIC-VIEW-SWITCHER-1.2 UIC-VIEW-SWITCHER-1.4 modifies, saves and resets a view', async ({
    page,
    lab,
  }) => {
    await lab.open('view-switcher');
    const demo = page.locator('[data-lab-demo="views-tabs"]');
    const root = demo.locator('.ui-view-switcher');
    await demo.getByRole('tab', { name: /^By cuisine/ }).click();
    await expect(demo.getByRole('tabpanel').locator('caption')).toHaveText('Recipes, By cuisine');
    await demo.getByRole('button', { name: 'Display' }).click();
    const options = page.getByRole('dialog', { name: 'Display options' });
    await options.getByRole('radio', { name: 'Default' }).click();
    await page.keyboard.press('Escape');
    await expect(root).toHaveAttribute('data-dirty', 'true');
    await demo.getByRole('button', { name: 'Actions for By cuisine' }).click();
    await page.getByRole('menuitem', { name: 'Reset changes' }).click();
    await expect(root).not.toHaveAttribute('data-dirty');
    await demo.getByRole('button', { name: 'Display' }).click();
    await options.getByRole('radio', { name: 'Default' }).click();
    await page.keyboard.press('Escape');
    await demo.getByRole('button', { name: 'Actions for By cuisine' }).click();
    await page.getByRole('menuitem', { name: 'Save', exact: true }).click();
    await expect(root).not.toHaveAttribute('data-dirty');
    await expect(demo.locator('[data-lab-output="table"]')).toHaveAttribute(
      'data-density',
      'default',
    );
  });

  test('UIC-VIEW-SWITCHER-1.5 UIC-VIEW-SWITCHER-1.6 UIC-VIEW-SWITCHER-1.7 saves as, renames, defaults and deletes views', async ({
    page,
    lab,
  }) => {
    await lab.open('view-switcher');
    const demo = page.locator('[data-lab-demo="views-tabs"]');
    await demo.getByRole('button', { name: 'Actions for All recipes' }).click();
    await page.getByRole('menuitem', { name: 'Save as new view' }).click();
    const create = page.getByRole('dialog', { name: 'New view' });
    const name = create.getByRole('textbox', { name: /^View name/ });
    await expect(name).toBeFocused();
    await name.fill('Weeknight');
    await name.press('Enter');
    await expect(create).toBeHidden();
    await expect(demo.getByRole('tab', { selected: true })).toHaveText('Weeknight');
    await demo.getByRole('tab', { name: /^Weeknight/ }).press('Shift+F10');
    await page.getByRole('menuitem', { name: 'Rename' }).click();
    const rename = page.getByRole('dialog', { name: 'Rename view' });
    await rename.getByRole('textbox', { name: /^View name/ }).fill('Weeknight dinners');
    await rename.getByRole('button', { name: 'Save' }).click();
    await expect(demo.getByRole('tab', { selected: true })).toHaveText('Weeknight dinners');
    await demo.getByRole('button', { name: 'Actions for Weeknight dinners' }).click();
    await page.getByRole('menuitem', { name: 'Set as default view' }).click();
    await expect(demo.locator('.ui-view-switcher__tab .ui-view-switcher__default')).toHaveCount(1);
    await expect(demo.getByRole('tab', { selected: true })).toHaveAccessibleName(
      'Weeknight dinners Default view',
    );
    await demo.getByRole('button', { name: 'Actions for Weeknight dinners' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    const confirm = page.getByRole('alertdialog', { name: 'Delete Weeknight dinners?' });
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect(confirm).toBeHidden();
    await expect(demo.getByRole('tab')).toHaveText(['All recipes', 'By cuisine']);
  });

  test('UIC-VIEW-SWITCHER-1.8 UIC-VIEW-SWITCHER-2.1 switches views from a menu named by a heading', async ({
    page,
    lab,
  }) => {
    await lab.open('view-switcher');
    const demo = page.locator('[data-lab-demo="views-menu"]');
    await demo.locator('.ui-view-switcher__menu').click();
    const menu = page.getByRole('menu', { name: 'Recipe views' });
    await expect(menu.getByRole('menuitemradio').first()).toContainText('Default view');
    await menu.getByRole('menuitemradio', { name: /By cuisine/ }).click();
    await expect(demo.locator('.ui-view-switcher__menu')).toHaveAccessibleName('By cuisine');
    await expect(demo.locator('caption')).toHaveText('Recipes, By cuisine');
  });

  test('UIC-VIEW-SWITCHER-2.1 moves between views by keyboard and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('view-switcher');
    const demo = page.locator('[data-lab-demo="views-tabs"]');
    const list = demo.getByRole('tablist', { name: 'Recipe views' });
    await list.getByRole('tab').first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(list.getByRole('tab').nth(1)).toBeFocused();
    await expect(list.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
    await lab.expectAccessible();
    await lab.open('view-switcher', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
