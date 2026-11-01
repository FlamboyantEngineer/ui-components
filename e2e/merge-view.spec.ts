import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

test.describe('Merge View lab', () => {
  test('UIC-MERGE-VIEW-1.1 UIC-MERGE-VIEW-1.2 UIC-MERGE-VIEW-2.1 UIC-MERGE-VIEW-3.1 UIC-MERGE-VIEW-4.1 draws every state', async ({
    page,
    lab,
  }) => {
    await lab.open('merge-view');
    const cell = (content: string, base: string) =>
      matrixCell(page, `content=${content} base=${base}`);
    const conflicts = cell('conflicts', 'shown');
    await expect(conflicts.getByRole('status')).toHaveText('3 of 3 conflicts unresolved');
    await expect(conflicts.locator('.ui-merge-view__side')).toHaveCount(4);
    await expect(cell('conflicts', 'hidden').locator('.ui-merge-view__side')).toHaveCount(3);
    await expect(cell('clean', 'shown').getByRole('status')).toHaveText('No conflicts');
    await expect(
      cell('clean', 'shown').locator('.ui-merge-view__block .ui-merge-view__text'),
    ).toHaveText(['one', 'TWO', 'three', 'four']);
    await expect(
      cell('identical', 'hidden').getByRole('button', { name: 'Next conflict' }),
    ).toBeDisabled();
    const line = conflicts
      .locator('[data-side="theirs"] .ui-merge-view__line[data-change="conflict"]')
      .first();
    await expect(line.locator('.ui-merge-view__marker')).toContainText('Conflict, line 1');
    const rows = (side: string) =>
      conflicts.locator(`[data-side="${side}"] .ui-merge-view__table tr`);
    await expect(rows('ours')).toHaveCount(await rows('theirs').count());
    const inserted = page.getByRole('group', { name: 'Inserted section merge' });
    await expect(inserted.getByRole('status')).toHaveText('No conflicts');
    await expect(inserted.locator('.ui-merge-view__block .ui-merge-view__text')).toHaveText(
      Array.from({ length: 24 }, (_, index) => `Step ${index + 1}`).join('\n'),
    );
    await lab.expectAccessible();
  });

  test('UIC-MERGE-VIEW-2.2 UIC-MERGE-VIEW-2.3 UIC-MERGE-VIEW-2.5 takes sides and reports the result', async ({
    page,
    lab,
  }) => {
    await lab.open('merge-view');
    const recipe = field(page, 'recipe');
    const first = recipe.getByRole('group', { name: 'Conflict 1 of 3' });
    await expect(first.getByRole('textbox', { name: 'Result of conflict 1' })).toHaveValue(
      /^<<<<<<< My edits\n/,
    );
    await first.getByRole('button', { name: 'Take Shared copy' }).click();
    await expect(first).toHaveAttribute('data-resolution', 'theirs');
    await expect(recipe.getByRole('status')).toHaveText('2 of 3 conflicts unresolved');
    await expect(output(page, 'resolutions')).toHaveText('theirs, unresolved, unresolved');
    const second = recipe.getByRole('group', { name: 'Conflict 2 of 3' });
    await second.getByRole('button', { name: 'Take My edits' }).click();
    const third = recipe.getByRole('group', { name: 'Conflict 3 of 3' });
    await third.getByRole('button', { name: 'Take both' }).click();
    await expect(recipe.getByRole('status')).toHaveText('All 3 conflicts resolved');
    await expect(output(page, 'unresolved')).toHaveText('0');
    await expect(output(page, 'text')).toContainText('Lemon and lime tart\nServes 12');
    await expect(output(page, 'text')).toContainText('Chill the pastry for 45 minutes.');
    await lab.expectAccessible('[data-lab-field="recipe"]');
  });

  test('UIC-MERGE-VIEW-2.4 UIC-MERGE-VIEW-3.2 moves between conflicts and edits a result', async ({
    page,
    lab,
  }) => {
    await lab.open('merge-view');
    const recipe = field(page, 'recipe');
    await recipe.getByRole('button', { name: 'Next conflict' }).click();
    await recipe.getByRole('button', { name: 'Next conflict' }).click();
    const editor = recipe.getByRole('textbox', { name: 'Result of conflict 2' });
    await expect(editor).toBeFocused();
    await expect(recipe.getByRole('group', { name: 'Conflict 2 of 3' })).toHaveAttribute(
      'data-current',
      'true',
    );
    await expect(recipe.locator('.ui-merge-view__chunk[data-current]')).toHaveCount(3);
    await editor.fill('Whisk six eggs with the lemon and lime juice.');
    await expect(recipe.getByRole('group', { name: 'Conflict 2 of 3' })).toHaveAttribute(
      'data-resolution',
      'edited',
    );
    await expect(output(page, 'text')).toContainText(
      'Whisk six eggs with the lemon and lime juice.',
    );
    await recipe.getByRole('button', { name: 'Previous conflict' }).click();
    await expect(recipe.getByRole('textbox', { name: 'Result of conflict 1' })).toBeFocused();
    await expect(recipe.getByRole('button', { name: 'Previous conflict' })).toBeDisabled();
  });

  test('UIC-MERGE-VIEW-2.5 starts a replaced merge over, undo history included', async ({
    page,
    lab,
  }) => {
    await lab.open('merge-view');
    const queued = field(page, 'queued');
    await queued.getByRole('button', { name: 'Take Ours' }).click();
    await expect(output(page, 'queued-text')).toHaveText('Use 3 eggs.');
    await page.getByRole('button', { name: 'Next merge' }).click();
    const conflict = queued.getByRole('group', { name: 'Conflict 1 of 1' });
    const editor = conflict.getByRole('textbox');
    await expect(editor).toHaveValue(/Rest for 2 hours\./);
    await editor.focus();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(conflict).toHaveAttribute('data-resolution', 'unresolved');
    await expect(editor).not.toHaveValue(/eggs/);
    await expect(output(page, 'queued-text')).toHaveText('');
  });

  test('UIC-MERGE-VIEW-2.5 keeps the blank line a taken side holds', async ({ page, lab }) => {
    await lab.open('merge-view');
    const merge = field(page, 'blank');
    await merge.scrollIntoViewIfNeeded();
    await merge.getByRole('button', { name: 'Take Ours' }).click();
    await expect(output(page, 'blank-text')).toHaveText('"Morning rota\\n\\nCheck the stores"');
    const editor = merge.getByRole('textbox');
    await editor.fill('Lunch at 12');
    await expect(output(page, 'blank-text')).toHaveText(
      '"Morning rota\\nLunch at 12\\nCheck the stores"',
    );
    await editor.fill('');
    await expect(output(page, 'blank-text')).toHaveText('"Morning rota\\nCheck the stores"');
  });

  test('UIC-MERGE-VIEW-1.3 scrolls every pane together', async ({ page, lab }) => {
    await lab.open('merge-view');
    const settings = field(page, 'settings');
    const viewport = (side: string) =>
      settings.locator(`[data-side="${side}"] .ui-scroll-region__viewport`);
    await viewport('ours').evaluate((element) => {
      element.scrollTop = 60;
    });
    expect(await viewport('ours').evaluate((element) => element.scrollTop)).toBe(60);
    await expect(async () => {
      const top = await viewport('theirs').evaluate((element) => element.scrollTop);
      expect(Math.abs(top - 60)).toBeLessThan(2);
    }).toPass();
    await expect(async () => {
      const top = await viewport('result').evaluate((element) => element.scrollTop);
      expect(top).toBeGreaterThan(0);
    }).toPass();
    await lab.expectAccessible('[data-lab-field="settings"]');
  });

  test('UIC-MERGE-VIEW-3.2 UIC-PORTAL-1.8 moves between conflicts inside a shadow root', async ({
    page,
    lab,
  }) => {
    await lab.open('merge-view');
    const demo = page.locator('[data-lab-demo="shadow-merge"]');
    await demo.scrollIntoViewIfNeeded();
    await demo.getByRole('button', { name: 'Next conflict' }).click();
    await expect(demo.getByRole('textbox', { name: 'Result of conflict 1' })).toBeFocused();
    await demo.getByRole('button', { name: 'Next conflict' }).click();
    await expect(demo.getByRole('textbox', { name: 'Result of conflict 2' })).toBeFocused();
    await demo.getByRole('button', { name: 'Previous conflict' }).click();
    await expect(demo.getByRole('textbox', { name: 'Result of conflict 1' })).toBeFocused();
  });
});
