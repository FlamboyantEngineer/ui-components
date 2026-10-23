import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function section(page: Page, title: string): Locator {
  return page.locator(`[data-lab-section="${title}"]`);
}

test.describe('People Picker lab', () => {
  test('UIC-PEOPLE-PICKER-1.1 draws combobox fields at three sizes and five states', async ({
    page,
    lab,
  }) => {
    await lab.open('people-picker');
    const cells = page.locator('table[data-lab-matrix="state size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(5 * 3);
    const resting = page.locator('[data-lab-cell="state=resting size=md"]');
    await expect(resting.locator('.ui-people-picker')).toHaveClass(/ui-combobox/);
    await expect(
      page.locator('[data-lab-cell="state=with value size=md"]').getByRole('combobox'),
    ).toHaveValue('Sam Rivera');
    await expect(
      page.locator('[data-lab-cell="state=disabled size=md"]').getByRole('combobox'),
    ).toBeDisabled();
    await expect(
      page.locator('[data-lab-cell="state=invalid size=md"]').locator('.ui-combobox__error'),
    ).toHaveText('Choose someone on the team');
    await lab.expectAccessible();
  });

  test('UIC-PEOPLE-PICKER-3.2 UIC-PEOPLE-PICKER-3.3 UIC-PEOPLE-PICKER-2.1 lists you and recent people, then searches', async ({
    page,
    lab,
  }) => {
    await lab.open('people-picker');
    const area = section(page, 'Single person');
    const input = area.getByRole('combobox', { name: 'Assignee' });
    await input.click();
    const listbox = page.getByRole('listbox');
    // The first key can land before the field is ready to open its list, so press until it opens.
    await expect(async () => {
      if (!(await listbox.isVisible())) await input.press('ArrowDown');
      await expect(listbox.getByRole('option')).toHaveCount(3, { timeout: 1000 });
    }).toPass();
    const self = listbox.getByRole('option').first();
    await expect(self).toHaveAccessibleName(/^Sam Rivera \(you\)/);
    await expect(self.locator('.ui-people-picker__you')).toHaveText('(you)');
    await expect(listbox.getByRole('group', { name: 'Recent' })).toBeVisible();
    await expect(page.locator('.ui-combobox__popover')).not.toHaveAttribute('data-entering');
    await lab.expectAccessible('.ui-combobox__popover');
    await page.keyboard.type('ch');
    const chen = listbox.getByRole('option', { name: /Chen Wei/ });
    await expect(chen).toBeVisible();
    await expect(chen.locator('.ui-people-picker__person')).toHaveAttribute('data-kind', 'person');
    await chen.click();
    await expect(input).toHaveValue('Chen Wei');
    await expect(area.locator('[data-lab-output="assignee"]')).toHaveText('chen');
  });

  test('UIC-PEOPLE-PICKER-1.2 UIC-PEOPLE-PICKER-2.2 UIC-PEOPLE-PICKER-2.3 UIC-PEOPLE-PICKER-3.1 picks people and groups as chips', async ({
    page,
    lab,
  }) => {
    await lab.open('people-picker');
    const area = section(page, 'People and groups');
    const input = area.getByRole('combobox', { name: 'Reviewers' });
    await input.click();
    await page.keyboard.type('s');
    const listbox = page.getByRole('listbox');
    const support = listbox.getByRole('option', { name: /Support desk/ });
    await expect(support.locator('.ui-people-picker__person')).toHaveAttribute(
      'data-kind',
      'group',
    );
    await support.click();
    await page.keyboard.type('cleo');
    const cleo = listbox.getByRole('option', { name: /Cleo Varga/ });
    await expect(cleo).toHaveAttribute('aria-disabled', 'true');
    await expect(cleo).toContainText('Account inactive');
    await page.keyboard.press('Escape');
    await expect(area.locator('[data-lab-output="reviewers"]')).toHaveText('ada, support');
    const chips = area.getByRole('grid', { name: 'Reviewers selected values' });
    // The decorative avatar's initials are hidden from assistive technology, not from the text.
    await expect(chips.getByRole('row').nth(0)).toHaveAccessibleName('Ada Moreno');
    await expect(chips.getByRole('row').nth(1)).toHaveAccessibleName('Support desk');
    const avatar = chips
      .getByRole('row', { name: 'Support desk' })
      .locator('.ui-people-picker__avatar');
    await expect(avatar).toHaveAttribute('data-kind', 'group');
    expect((await avatar.boundingBox())?.width).toBe(16);
    await lab.expectAccessible();
  });

  test('UIC-PEOPLE-PICKER-3.5 names the people of a saved value before a search', async ({
    page,
    lab,
  }) => {
    await lab.open('people-picker');
    const area = section(page, 'Saved value');
    const chips = area.getByRole('grid', { name: 'Watchers selected values' });
    await expect(chips.getByRole('row').nth(0)).toHaveAccessibleName('Chen Wei');
    await expect(chips.getByRole('row').nth(1)).toHaveAccessibleName('Support desk');
    await area.getByRole('combobox', { name: 'Watchers' }).focus();
    await page.keyboard.press('ArrowDown');
    const listbox = page.getByRole('listbox');
    await expect(listbox.getByRole('option')).toHaveCount(2);
    await expect(listbox.getByRole('option').nth(0)).toContainText('Chen Wei');
  });
});
