import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, layout: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} layout=${layout}"]`);
}

function passage(page: Page): Locator {
  return page.locator('[data-lab-case="passage"]');
}

test.describe('Find Bar lab', () => {
  test('UIC-FIND-BAR-1.2 UIC-FIND-BAR-2.1 draws each state with its count and its parts', async ({
    page,
    lab,
  }) => {
    await lab.open('find-bar');
    await expect(cell(page, 'empty', 'find').locator('.ui-find-bar__status')).toHaveText('');
    await expect(cell(page, 'matches', 'find').locator('.ui-find-bar__status')).toHaveText(
      '3 of 12',
    );
    await expect(cell(page, 'no-results', 'find').locator('.ui-find-bar__status')).toHaveText(
      'No results',
    );
    const searching = cell(page, 'searching', 'find');
    await expect(searching.locator('.ui-find-bar__status')).toHaveText('Searching…');
    await expect(searching.locator('.ui-find-bar')).toHaveAttribute('data-pending', 'true');
    await expect(
      cell(page, 'no-results', 'find').getByRole('button', { name: 'Next match' }),
    ).toBeDisabled();

    const replace = cell(page, 'matches', 'replace');
    await expect(replace.getByRole('textbox', { name: 'Replace with' })).toBeVisible();
    await expect(replace.getByRole('button', { name: 'Replace all' })).toBeEnabled();
    await expect(
      cell(page, 'empty', 'replace').getByRole('button', { name: 'Replace', exact: true }),
    ).toBeDisabled();
    await expect(
      cell(page, 'matches', 'options').getByRole('button', { name: 'Find options' }),
    ).toBeVisible();
    await lab.expectAccessible();
  });

  test('UIC-FIND-BAR-1.1 UIC-FIND-BAR-1.3 finds and steps with Enter, Shift+Enter and the buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('find-bar');
    const area = passage(page);
    const box = area.getByRole('searchbox', { name: 'Find in the recipe' });
    const status = area.locator('.ui-find-bar__status');
    await expect(box).toHaveValue('pear');
    await expect(status).toHaveText('1 of 5');
    await expect(area.locator('mark')).toHaveCount(5);
    await box.press('Enter');
    await expect(status).toHaveText('2 of 5');
    await expect(area.locator('mark[data-lab-current]')).toHaveText('pear');
    await box.press('Shift+Enter');
    await box.press('Shift+Enter');
    await expect(status).toHaveText('5 of 5');
    await area.getByRole('button', { name: 'Next match' }).click();
    await expect(status).toHaveText('1 of 5');
    await area.getByRole('button', { name: 'Previous match' }).click();
    await expect(status).toHaveText('5 of 5');
    await box.fill('quince');
    await expect(status).toHaveText('No results');
    await area.getByRole('button', { name: 'Clear search' }).click();
    await expect(box).toHaveValue('');
    await expect(status).toHaveText('');
  });

  test('UIC-FIND-BAR-1.4 matches case and whole words from the options menu', async ({
    page,
    lab,
  }) => {
    await lab.open('find-bar');
    const area = passage(page);
    const status = area.locator('.ui-find-bar__status');
    await area.getByRole('button', { name: 'Find options' }).click();
    const menu = page.getByRole('menu', { name: 'Find options' });
    await menu.getByRole('menuitemcheckbox', { name: 'Whole words' }).click();
    await expect(status).toHaveText('1 of 2');
    await menu.getByRole('menuitemcheckbox', { name: 'Match case' }).click();
    await expect(status).toHaveText('1 of 1');
    await expect(menu.getByRole('menuitemcheckbox', { name: 'Match case' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(area.locator('[data-lab-output="options"]')).toHaveText('words, case');
    await lab.expectAccessible('.ui-menu-popover');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(area.locator('[data-lab-output="open"]')).toHaveText('yes');
  });

  test('UIC-FIND-BAR-1.5 replaces the current match and then every match', async ({
    page,
    lab,
  }) => {
    await lab.open('find-bar');
    const area = passage(page);
    const status = area.locator('.ui-find-bar__status');
    const text = area.locator('[data-lab-text]');
    const replacement = area.getByRole('textbox', { name: 'Replace with' });
    await expect(replacement).toHaveValue('plum');
    await area.getByRole('button', { name: 'Replace', exact: true }).click();
    await expect(text).toContainText('Peel the plums and cut each pear');
    await expect(status).toHaveText('1 of 4');
    await replacement.fill('fig');
    await replacement.press('Enter');
    await expect(text).toContainText('cut each fig in half');
    await area.getByRole('button', { name: 'Replace all' }).click();
    await expect(text).toContainText('Poach the figs in syrup');
    await expect(text).toContainText('figl sugar');
    await expect(status).toHaveText('No results');
  });

  test('UIC-FIND-BAR-1.6 closes on Escape and Close, and the caller reopens it with Ctrl+F', async ({
    page,
    lab,
  }) => {
    await lab.open('find-bar');
    const area = passage(page);
    const box = area.getByRole('searchbox', { name: 'Find in the recipe' });
    await box.press('Escape');
    await expect(area.locator('.ui-find-bar')).toHaveCount(0);
    await expect(area.locator('[data-lab-output="open"]')).toHaveText('no');
    await area.locator('[data-lab-text]').focus();
    await page.keyboard.press('Control+f');
    await expect(box).toBeFocused();
    await expect(box).toHaveValue('pear');
    await area.getByRole('button', { name: 'Close' }).click();
    await expect(area.locator('.ui-find-bar')).toHaveCount(0);
    await area.getByRole('button', { name: 'Find' }).click();
    await expect(box).toBeFocused();
    await lab.expectAccessible();
  });
});
