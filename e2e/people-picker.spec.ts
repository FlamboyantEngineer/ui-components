import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

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
    const resting = matrixCell(page, 'state=resting size=md');
    await expect(resting.locator('.ui-people-picker')).toHaveClass(/ui-combobox/);
    await expect(matrixCell(page, 'state=with value size=md').getByRole('combobox')).toHaveValue(
      'Sam Rivera',
    );
    await expect(matrixCell(page, 'state=disabled size=md').getByRole('combobox')).toBeDisabled();
    await expect(
      matrixCell(page, 'state=invalid size=md').locator('.ui-combobox__error'),
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

  test('UIC-PEOPLE-PICKER-3.1 UIC-PEOPLE-PICKER-3.6 restores a searched person and draws the newest copy', async ({
    page,
    lab,
  }) => {
    await lab.open('people-picker');
    const area = section(page, 'Restoring a chosen person');
    const input = area.getByRole('combobox', { name: 'Handover owner' });
    const listbox = page.getByRole('listbox');
    await input.focus();
    await page.keyboard.press('ArrowDown');
    await expect(listbox.getByRole('option', { name: /Eli Brandt \(old record\)/ })).toBeDisabled();
    await input.fill('eli');
    const eli = listbox.getByRole('option', { name: /Eli Brandt/ });
    await expect(eli).toContainText('eli.brandt@example.com');
    await expect(eli).not.toContainText('old record');
    await expect(eli).toBeEnabled();
    await input.fill('dara');
    await expect(listbox.getByRole('option', { name: /Dara Nkemelu/ })).toBeVisible();
    await input.fill('ben');
    await expect(listbox.getByRole('option', { name: /Ben Okafor/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Restore Dara' }).click();
    await expect(input).toHaveValue('Dara Nkemelu');
    await expect(area.locator('[data-lab-output="owner"]')).toHaveText('dara');
  });

  test('UIC-PEOPLE-PICKER-3.1 pages a remote directory, reports a failed search and retries it', async ({
    page,
    lab,
  }) => {
    await lab.open('people-picker');
    const demo = page.locator('[data-lab-demo="paged-directory"]');
    const log = demo.locator('[data-lab-output="directory-log"] li');
    const input = demo.getByRole('combobox', { name: 'Watchers' });
    await input.scrollIntoViewIfNeeded();
    await input.fill('nor');
    await input.pressSequentially('th');
    await expect(page.getByRole('option', { name: /^Alex North/ })).toBeVisible();
    await expect(log.filter({ hasText: 'aborted' }).first()).toHaveText('aborted "nor" from 0');
    // The end of the list is in view, so the next page loads.
    await page.locator('.ui-combobox__listbox').evaluate((listbox) => {
      listbox.scrollTop = listbox.scrollHeight;
    });
    const later = page.getByRole('option', { name: /^Gus North/ });
    await expect(later).toBeVisible();
    await expect(log.filter({ hasText: 'page "north"' })).toHaveText([
      'page "north" 1-5 of 7',
      'page "north" 6-7 of 7',
    ]);
    await later.click();
    await expect(demo.locator('[data-lab-output="watchers"]')).toHaveText('gus-north');

    await input.fill('lund');
    await expect(page.getByRole('option', { name: /^Alex Lund/ })).toBeVisible();
    await expect(demo.locator('.ui-combobox__chips [role="row"]')).toHaveText(['GNGus North']);
    await expect(log.last()).toHaveText('page "lund" 6-7 of 7');
    await page.keyboard.press('Escape');

    await demo.getByRole('button', { name: 'Fail the next search' }).click();
    await expect(demo.locator('[data-lab-output="next search"]')).toHaveText('fails');
    await input.fill('marsh');
    await expect(page.getByText('Search is unavailable.')).toBeVisible();
    await expect(log.last()).toHaveText('failed "marsh"');
    // Changing the text searches again, and the directory answers.
    await input.press('Backspace');
    await input.press('h');
    await expect(page.getByRole('option', { name: /^Alex Marsh/ })).toBeVisible();
    await expect(demo.locator('.ui-combobox__chips [role="row"]')).toHaveText(['GNGus North']);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await lab.expectAccessible('[data-lab-demo="paged-directory"]');
  });
});
