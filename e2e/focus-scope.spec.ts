import { cellSelector, expect, test } from './fixtures.js';

const cellOf = (autoFocus: string, restoreFocus: string, contain: string) =>
  cellSelector(`autoFocus=${autoFocus} restoreFocus=${restoreFocus} contain=${contain}`);

test.describe('Focus Scope lab', () => {
  test('UIC-FOCUS-SCOPE-1.1 UIC-FOCUS-SCOPE-2.1 UIC-FOCUS-SCOPE-2.4 wraps the region in one element and leaves focus alone without autoFocus', async ({
    page,
    lab,
  }) => {
    await lab.open('focus-scope');
    const cell = page.locator(cellOf('off', 'off', 'off'));
    const open = cell.getByRole('button', { name: 'Open' });
    await open.click();
    const scope = cell.locator('.ui-focus-scope');
    await expect(scope).toHaveAttribute('role', 'group');
    await expect(cell.getByRole('group', { name: 'Delivery' })).toBeVisible();
    await expect(scope).not.toHaveAttribute('data-contain');
    await expect(scope.getByRole('textbox', { name: 'City' })).toBeVisible();
    await expect(open).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(scope.getByRole('textbox', { name: 'City' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(scope.getByRole('button', { name: 'Close' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator(cellOf('off', 'off', 'on')).getByRole('button')).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-FOCUS-SCOPE-2.2 UIC-FOCUS-SCOPE-2.4 UIC-FOCUS-SCOPE-2.6 focuses the field, keeps Tab inside and returns focus to the opener', async ({
    page,
    lab,
  }) => {
    await lab.open('focus-scope');
    const cell = page.locator(cellOf('on', 'on', 'on'));
    const open = cell.getByRole('button', { name: 'Open' });
    await open.click();
    const scope = cell.locator('.ui-focus-scope');
    const city = scope.getByRole('textbox', { name: 'City' });
    const close = scope.getByRole('button', { name: 'Close' });
    await expect(scope).toHaveAttribute('data-contain', 'true');
    await expect(city).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(city).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(close).toBeFocused();

    await page.getByText('Open a scope in each combination').click();
    await expect(close).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(scope).toHaveCount(0);
    await expect(open).toBeFocused();
  });

  test('UIC-FOCUS-SCOPE-2.3 releases the trap when the switch turns containment off', async ({
    page,
    lab,
  }) => {
    await lab.open('focus-scope');
    const demo = page.locator('[data-lab-demo="editor"]');
    const scope = demo.locator('.ui-focus-scope');
    const name = demo.getByRole('textbox', { name: 'Name' });
    const save = demo.getByRole('button', { name: 'Save' });
    const toggle = demo.getByRole('switch', { name: 'Keep focus in the editor' });
    await expect(scope).not.toHaveAttribute('data-contain');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await expect(scope).toHaveAttribute('data-contain', 'true');
    await save.focus();
    await page.keyboard.press('Tab');
    await expect(name).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(save).toBeFocused();
    await demo.getByRole('button', { name: 'After the editor' }).click();
    await expect(save).toBeFocused();

    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).not.toBeChecked();
    await expect(scope).not.toHaveAttribute('data-contain');
    await save.focus();
    await page.keyboard.press('Tab');
    await expect(demo.getByRole('button', { name: 'After the editor' })).toBeFocused();

    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(scope).toHaveAttribute('data-contain', 'true');
    await save.focus();
    await page.keyboard.press('Tab');
    await expect(name).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-FOCUS-SCOPE-2.5 UIC-FOCUS-SCOPE-2.7 focuses the chosen field on open and the chosen heading on close', async ({
    page,
    lab,
  }) => {
    await lab.open('focus-scope');
    const demo = page.locator('[data-lab-demo="rename"]');
    const heading = demo.locator('[data-lab-output="name"]');
    await demo.getByRole('button', { name: 'Rename' }).click();
    const field = demo.getByRole('textbox', { name: 'New name' });
    await expect(field).toBeFocused();
    await expect(demo.getByRole('textbox', { name: 'Category' })).not.toBeFocused();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Lemon meringue tart');
    await demo.getByRole('button', { name: 'Save name' }).click();
    await expect(demo.locator('.ui-focus-scope')).toHaveCount(0);
    await expect(heading).toHaveText('Lemon meringue tart');
    await expect(heading).toBeFocused();

    await demo.getByRole('button', { name: 'Rename' }).press('Enter');
    await expect(field).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(demo.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(heading).toBeFocused();
  });

  test('UIC-FOCUS-SCOPE-3.1 moves focus with the arrow keys through the focus manager', async ({
    page,
    lab,
  }) => {
    await lab.open('focus-scope');
    const filters = page.getByRole('toolbar', { name: 'Fruit filters' });
    const button = (name: string) => filters.getByRole('button', { name });
    await button('Apples').focus();
    await page.keyboard.press('ArrowRight');
    await expect(button('Pears')).toBeFocused();
    await page.keyboard.press('End');
    await expect(button('Cherries')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(button('Apples')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(button('Cherries')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(button('Apples')).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-FOCUS-SCOPE-2.7 returns focus to finalFocus inside a frame the page renders into', async ({
    page,
    lab,
  }) => {
    await lab.open('focus-scope');
    const frame = page.frameLocator('[data-lab-demo="frame"]');
    const edit = frame.getByRole('button', { name: 'Edit note' });
    await edit.click();
    const note = frame.getByRole('textbox', { name: 'Note' });
    await expect(note).toBeFocused();
    await frame.getByRole('button', { name: 'Save note' }).click();
    await expect(frame.getByRole('group', { name: 'Edit note' })).toHaveCount(0);
    await expect(frame.getByText('Note saved')).toBeFocused();

    // Focus the reader moved to the page around the frame stays there.
    await edit.click();
    await expect(note).toBeFocused();
    const rename = page.getByRole('button', { name: 'Rename' });
    await rename.focus();
    await expect(rename).toBeFocused();
    await frame
      .locator('body')
      .evaluate((body) =>
        body.querySelector<HTMLButtonElement>('[aria-label="Edit note"] button')?.click(),
      );
    await expect(frame.getByRole('group', { name: 'Edit note' })).toHaveCount(0);
    await expect(rename).toBeFocused();
  });
});
