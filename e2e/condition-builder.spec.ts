import { expect, test, matrixCell } from './fixtures.js';

test.describe('Condition Builder lab', () => {
  test('UIC-CONDITION-BUILDER-1.2 UIC-CONDITION-BUILDER-1.6 UIC-CONDITION-BUILDER-3.1 draws groups, rules and messages', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const cells = page.locator('table[data-lab-matrix="state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4);
    await expect(
      matrixCell(page, 'state=empty').locator('.ui-condition-builder__empty'),
    ).toHaveText('No rules yet.');
    const nested = page.getByRole('group', { name: 'Conditions, nested' });
    await expect(nested.getByRole('group', { name: 'Group' })).toHaveAttribute('data-depth', '2');
    const invalid = page.getByRole('group', { name: 'Conditions, invalid' });
    await expect(invalid.getByRole('group', { name: 'Rule 1' })).toHaveAccessibleDescription(
      'Enter a value.',
    );
    await expect(invalid.getByRole('group', { name: 'Rule 2' })).toHaveAccessibleDescription(
      'Books in this catalogue have at most 1,500 pages.',
    );
    const depth = page.locator('[data-lab-demo="depth"]');
    await expect(depth.getByRole('button', { name: 'Add group' })).toHaveCount(1);
    await lab.expectAccessible();
  });

  test('UIC-CONDITION-BUILDER-1.3 UIC-CONDITION-BUILDER-1.4 UIC-CONDITION-BUILDER-2.1 UIC-CONDITION-BUILDER-2.2 edits the tree that narrows the list', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const demo = page.locator('[data-lab-demo="live"]');
    await expect(demo.locator('[data-lab-results] li')).toHaveText([
      'A Lantern at Sea',
      'Bread Without Haste',
    ]);
    const group = demo.getByRole('group', { name: 'Group' });
    await group.getByRole('radio', { name: 'All' }).click();
    await expect(demo.locator('[data-lab-results] li')).toHaveCount(0);
    await group.getByRole('radio', { name: 'Any' }).click();
    await demo.getByRole('button', { name: 'Add rule' }).last().click();
    const added = demo.getByRole('group', { name: 'Rule 3' });
    await expect(added.getByRole('button', { name: /Field/ })).toBeFocused();
    await added.getByRole('button', { name: /Field/ }).click();
    await page.getByRole('option', { name: 'Genre' }).click();
    await added.getByRole('button', { name: /Value/ }).click();
    await page.getByRole('option', { name: 'Cooking' }).click();
    await page.keyboard.press('Escape');
    await expect(demo.locator('[data-lab-count]')).toHaveText('1 of 8 books');
    await expect(demo.locator('[data-lab-results] li')).toHaveText(['Bread Without Haste']);
  });

  test('UIC-CONDITION-BUILDER-1.5 UIC-CONDITION-BUILDER-3.2 moves with Alt+Arrow and the menu, then deletes', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const demo = page.locator('[data-lab-demo="live"]');
    const value = demo.locator('[data-lab-value]');
    const first = demo.getByRole('group', { name: 'Rule 1' }).first();
    await first.getByRole('button', { name: 'Actions' }).focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(page.getByRole('menu')).toHaveCount(0);
    await expect(value).toContainText('"id": "either"');
    expect((await value.textContent())?.indexOf('"either"')).toBeLessThan(
      (await value.textContent())?.indexOf('"available"') ?? 0,
    );
    const moved = demo.getByRole('group', { name: 'Rule 2' }).last();
    await expect(moved.getByRole('button', { name: 'Actions' })).toBeFocused();
    await moved.getByRole('button', { name: 'Actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(demo.getByRole('button', { name: 'Add rule' }).last()).toBeFocused();
    await expect(value).not.toContainText('"available"');
    await lab.expectAccessible();
  });

  test('UIC-CONDITION-BUILDER-1.1 keeps ids unique after a saved tree is restored', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const demo = page.locator('[data-lab-demo="saved"]');
    const addRule = () => demo.getByRole('button', { name: 'Add rule' }).last().click();
    await addRule();
    await demo.getByRole('button', { name: 'Save the tree' }).click();
    await demo.getByRole('button', { name: 'Restore the saved tree' }).click();
    await addRule();
    await addRule();
    await expect(demo.locator('[data-lab-unique]')).toHaveText(/^(\d+) of \1 ids unique$/);
  });

  test('UIC-CONDITION-BUILDER-1.8 opens rule and group context menus with and without menu buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('condition-builder');
    const shown = matrixCell(page, 'buttons=shown');
    const hidden = matrixCell(page, 'buttons=hidden');
    await expect(shown.getByRole('button', { name: 'Actions' })).toHaveCount(4);
    await expect(hidden.getByRole('button', { name: 'Actions' })).toHaveCount(0);
    const nested = hidden.getByRole('group', { name: 'Group' });
    const inner = nested.getByRole('group', { name: 'Rule 1' });
    // A secondary click between the rule's controls opens its menu, not the group's.
    await inner.scrollIntoViewIfNeeded();
    const field = await inner.locator('.ui-condition-builder__field').boundingBox();
    const operator = await inner.locator('.ui-condition-builder__operator').boundingBox();
    if (!field || !operator) throw new Error('The rule has no layout box.');
    await page.mouse.click((field.x + field.width + operator.x) / 2, field.y + field.height / 2, {
      button: 'right',
    });
    const menu = page.getByRole('menu', { name: 'Actions' });
    await expect(menu).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: 'Move up' })).toBeDisabled();
    await menu.getByRole('menuitem', { name: 'Move down' }).click();
    const moved = nested.getByRole('group', { name: 'Rule 2' });
    await expect(moved).toBeFocused();
    // On the focused rule, the menu key opens the same menu, and Alt+Arrow moves it back.
    await page.keyboard.press('Shift+F10');
    await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(moved).toBeFocused();
    await page.keyboard.press('Alt+ArrowUp');
    await expect(nested.getByRole('group', { name: 'Rule 1' })).toBeFocused();
    // The group's header opens the group's own menu; the shown buttons keep their context menus.
    await nested
      .locator('.ui-condition-builder__group-header')
      .click({ button: 'right', position: { x: 300, y: 8 } });
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    await expect(hidden.getByRole('group', { name: 'Group' })).toHaveCount(2);
    await shown
      .getByRole('group', { name: 'Rule 1' })
      .first()
      .click({ button: 'right', position: { x: 2, y: 2 } });
    await expect(page.getByRole('menu', { name: 'Actions' })).toBeVisible();
    await page.keyboard.press('Escape');
    await lab.expectAccessible();
  });
});
