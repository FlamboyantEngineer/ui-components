import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

const stepOrder = async (demo: Locator) =>
  JSON.parse((await demo.locator('[data-lab-value]').textContent()) ?? '[]').map(
    (step: { id: string }) => step.id,
  );

test.describe('Step List Editor lab', () => {
  test('UIC-STEP-LIST-EDITOR-1.1 UIC-STEP-LIST-EDITOR-1.2 UIC-STEP-LIST-EDITOR-3.1 UIC-STEP-LIST-EDITOR-3.2 draws numbered steps, dirty marks and read-only lists', async ({
    page,
    lab,
  }) => {
    await lab.open('step-list-editor');
    const cells = page.locator('table[data-lab-matrix="state"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4);
    const empty = page.getByRole('group', { name: 'Steps, empty' });
    await expect(empty.locator('.ui-step-list-editor__empty')).toContainText('No steps yet.');
    const filled = page.getByRole('group', { name: 'Steps, filled' });
    await expect(filled.locator('.ui-step-list-editor__number')).toHaveText(['1', '2', '3', '4']);
    await expect(
      filled.getByRole('group', { name: 'Step 2' }).getByRole('textbox', { name: 'Data' }),
    ).toHaveValue('ada.lovelace');
    const dirty = page.getByRole('group', { name: 'Steps, dirty' });
    await expect(dirty).toHaveAttribute('data-dirty', 'true');
    await expect(dirty.locator('.ui-step-list-editor__step[data-dirty]')).toHaveCount(2);
    await expect(dirty.locator('.ui-step-list-editor__field[data-dirty]')).toHaveCount(1);
    const readOnly = page.getByRole('group', { name: 'Steps, read-only' });
    await expect(readOnly.getByRole('button')).toHaveCount(0);
    await expect(readOnly.getByRole('textbox').first()).toHaveAttribute('readonly', '');
    await lab.expectAccessible();
  });

  test('UIC-STEP-LIST-EDITOR-1.3 UIC-STEP-LIST-EDITOR-2.1 UIC-STEP-LIST-EDITOR-3.1 edits, adds, duplicates and deletes steps', async ({
    page,
    lab,
  }) => {
    await lab.open('step-list-editor');
    const demo = page.locator('[data-lab-demo="live"]');
    const value = demo.locator('[data-lab-value]');
    const expected = demo.getByRole('group', { name: 'Step 4' }).getByRole('textbox', {
      name: 'Expected result',
    });
    await expected.fill('The home page opens with a greeting');
    await expect(value).toContainText('with a greeting');
    await expect(demo.locator('.ui-step-list-editor__step[data-key="submit"]')).toHaveAttribute(
      'data-dirty',
      'true',
    );

    await demo.getByRole('button', { name: 'Add step' }).click();
    const added = demo.getByRole('group', { name: 'Step 5' });
    await expect(added.getByRole('textbox', { name: 'Action' })).toBeFocused();
    await page.keyboard.type('Sign out');
    await expect(value).toContainText('"action": "Sign out"');

    await demo.getByRole('button', { name: 'Actions for step 2' }).click();
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();
    const copy = demo.getByRole('group', { name: 'Step 3' });
    await expect(copy.getByRole('textbox', { name: 'Data' })).toHaveValue('ada.lovelace');
    await expect(copy.getByRole('textbox', { name: 'Action' })).toBeFocused();

    await demo.getByRole('button', { name: 'Actions for step 3' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await expect(demo.locator('.ui-step-list-editor__step')).toHaveCount(5);
    await expect(
      demo.getByRole('group', { name: 'Step 3' }).getByRole('textbox', { name: 'Action' }),
    ).toBeFocused();

    await demo.getByRole('button', { name: 'Save steps' }).click();
    await expect(demo.locator('.ui-step-list-editor__step[data-dirty]')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-STEP-LIST-EDITOR-2.2 UIC-STEP-LIST-EDITOR-2.3 moves steps with Alt+Arrow keys and the menu, keeping focus', async ({
    page,
    lab,
  }) => {
    await lab.open('step-list-editor');
    const demo = page.locator('[data-lab-demo="live"]');
    const action = demo
      .locator('.ui-step-list-editor__step[data-key="open"]')
      .getByRole('textbox', { name: 'Action' });
    await action.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => stepOrder(demo)).toEqual(['name', 'open', 'password', 'submit']);
    await expect(action).toBeFocused();
    await expect(demo.locator('.ui-step-list-editor__number').nth(1)).toHaveText('2');
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => stepOrder(demo)).toEqual(['name', 'password', 'open', 'submit']);
    await expect(action).toBeFocused();

    await demo.getByRole('button', { name: 'Actions for step 4' }).click();
    await page.getByRole('menuitem', { name: 'Move up' }).click();
    await expect.poll(() => stepOrder(demo)).toEqual(['name', 'password', 'submit', 'open']);
    await expect(demo.getByRole('button', { name: 'Actions for step 3' })).toBeFocused();
  });

  test('UIC-STEP-LIST-EDITOR-2.4 drags a step by its handle onto another step', async ({
    page,
    lab,
  }) => {
    await lab.open('step-list-editor');
    const demo = page.locator('[data-lab-demo="live"]');
    await demo.locator('.ui-step-list-editor__steps').scrollIntoViewIfNeeded();
    const handle = await demo.getByRole('button', { name: 'Move step 1' }).boundingBox();
    const target = await demo
      .locator('.ui-step-list-editor__step[data-key="password"]')
      .boundingBox();
    if (!handle || !target) throw new Error('The handle and the target step must be on screen.');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + 30, handle.y + 40, { steps: 5 });
    await page.mouse.move(target.x + 100, target.y + 20, { steps: 10 });
    await page.mouse.up();
    await expect.poll(() => stepOrder(demo)).toEqual(['name', 'password', 'open', 'submit']);
    // The drop lands on the step, never as text in the field under the pointer.
    await expect(demo.locator('[data-lab-value]')).not.toContainText('Step 1');
    await expect(demo.locator('[data-dragging], [data-drop-target]')).toHaveCount(0);
  });

  test('UIC-STEP-LIST-EDITOR-2.4 drags a step by keyboard from its handle', async ({
    page,
    lab,
  }) => {
    await lab.open('step-list-editor');
    const demo = page.locator('[data-lab-demo="live"]');
    await demo.getByRole('button', { name: 'Move step 4' }).focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('.ui-step-list-editor__step[data-drop-target]')).toHaveCount(1);
    await page.keyboard.press('Enter');
    await expect.poll(() => stepOrder(demo)).not.toEqual(['open', 'name', 'password', 'submit']);
    expect((await stepOrder(demo)).indexOf('submit')).toBeLessThan(3);
  });
});
