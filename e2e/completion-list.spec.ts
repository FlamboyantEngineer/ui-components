import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const editor = (page: Page, cell: string) => page.locator(`[data-lab-editor="${cell}"]`);

test.describe('Completion List lab', () => {
  test('UIC-COMPLETION-LIST-2.2 UIC-COMPLETION-LIST-2.4 stops suggesting when completions are removed', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const note = page.getByRole('textbox', { name: 'Note' });
    await note.fill('Ask @Jon');
    await expect(page.getByRole('option', { name: /Jon Berg/ })).toBeVisible();
    await page.getByRole('button', { name: 'Disable note suggestions' }).click();
    await note.focus();
    await note.press('Control+Space');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(note).toHaveValue('Ask @Jon');
    await page.getByRole('button', { name: 'Enable note suggestions' }).click();
    await note.focus();
    await note.press('Control+Space');
    await expect(page.getByRole('option', { name: /Jon Berg/ })).toBeVisible();
    await note.press('Enter');
    await expect(note).toHaveValue('Ask @jon ');
  });

  test('UIC-COMPLETION-LIST-2.6 drops an answer for text the host reloaded', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('completion-list');
    const field = page
      .locator('[data-lab-demo="reloaded"]')
      .getByRole('textbox', { name: 'Document' });
    await field.focus();
    await field.press('End');
    await field.press('Control+Space');
    await page.clock.runFor(2000);
    await expect(field).toHaveValue('Reloaded from the server');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await field.press('Control+Space');
    await page.clock.runFor(2000);
    await expect(page.getByRole('option', { name: 'alpha' })).toBeVisible();
    await field.press('Enter');
    await expect(field).toHaveValue('Reloaded from the alpha');
  });

  test('UIC-COMPLETION-LIST-1.1 UIC-COMPLETION-LIST-1.2 UIC-COMPLETION-LIST-1.4 opens below the editor with the active documentation', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const input = editor(page, 'documentation-footer');
    await input.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await input.focus();
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    const options = list.getByRole('option');
    await expect(options).toHaveCount(4);
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await expect(options.first()).toHaveAttribute('data-kind', 'city');
    await expect(input).toHaveAttribute('aria-controls', (await list.getAttribute('id')) ?? '');
    await expect(async () => {
      const anchor = await input.boundingBox();
      const popover = await page.locator('[data-lab-list="documentation-footer"]').boundingBox();
      expect(anchor && popover && popover.y >= anchor.y + anchor.height).toBe(true);
      expect(anchor && popover && popover.y - (anchor.y + anchor.height) < 8).toBe(true);
      expect(anchor && popover && Math.abs(popover.x - anchor.x) < 2).toBe(true);
    }).toPass();
    await expect(page.locator('.ui-completion-list__documentation')).toHaveText(
      'Lisbon is a city in Portugal.',
    );
    await expect(options.first()).toHaveAccessibleDescription('Lisbon is a city in Portugal.');
    await expect(page.locator('.ui-completion-list__footer')).toHaveText('4 matches');
    await page.keyboard.press('ArrowDown');
    await expect(input).toHaveAttribute(
      'aria-activedescendant',
      (await options.nth(1).getAttribute('id')) ?? '',
    );
    await expect(page.locator('.ui-completion-list__documentation')).toHaveText(
      'London is a city in United Kingdom.',
    );
    await page.keyboard.type('y');
    await expect(options).toHaveText(['Lyon France']);
    await expect(page.locator('.ui-completion-list__footer')).toHaveText('1 matches');
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(input).toHaveValue('Lyon');
  });

  test('UIC-COMPLETION-LIST-1.3 activates under the pointer and inserts on press, keeping focus', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const input = editor(page, 'drawn-none');
    await input.focus();
    const oslo = page.getByRole('option', { name: /Oslo/ });
    await oslo.hover();
    await expect(oslo).toHaveAttribute('aria-selected', 'true');
    await expect(oslo).toContainText('Norway');
    await oslo.click();
    await expect(input).toHaveValue('Oslo');
    await expect(input).toBeFocused();
  });

  test('UIC-COMPLETION-LIST-1.4 shows an empty state and keeps a long list scrolled to the active option', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    await editor(page, 'labels-empty state').focus();
    await expect(page.getByRole('status').filter({ hasText: 'No cities match' })).toBeVisible();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    const long = editor(page, 'long');
    await long.focus();
    await page.keyboard.press('ArrowUp');
    const zurich = page.getByRole('option', { name: 'Zurich' });
    await expect(zurich).toHaveAttribute('aria-selected', 'true');
    await expect(zurich).toBeInViewport();
    await expect(page.getByRole('option', { name: 'Amsterdam' })).not.toBeInViewport();
    await expect(page.locator('.ui-completion-list__footer')).toContainText('38 matches');
    await lab.expectAccessible();
    await lab.expectAccessible('[data-lab-list="long"]');
  });

  test('UIC-COMPLETION-LIST-1.2 keeps a completion list usable after Tab scrolls its editor into view', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    await editor(page, 'drawn-empty state').focus();
    await expect(page.getByRole('status').filter({ hasText: 'No cities match' })).toBeVisible();
    await page.keyboard.press('Tab');
    const long = editor(page, 'long');
    await expect(long).toBeFocused();
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(38);
    const scroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('ArrowUp');
    const last = list.getByRole('option', { name: 'Zurich' });
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await expect(last).toBeInViewport();
    await expect(async () => expect(await page.evaluate(() => scrollY)).toBe(scroll)).toPass();
  });

  test('UIC-COMPLETION-LIST-2.5 mentions people and references after their trigger characters', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const note = page.getByRole('textbox', { name: 'Note' });
    await note.click();
    await note.pressSequentially('Ask @Jon');
    const list = page.getByRole('listbox', { name: 'Suggestions' });
    await expect(list.getByRole('option')).toHaveCount(1);
    await expect(list.getByRole('option')).toContainText('Jon Berg');
    await page.keyboard.press('Enter');
    await expect(note).toHaveValue('Ask @jon ');
    await note.pressSequentially('about #1');
    await expect(list.getByRole('option')).toHaveText(['Requirement 12', 'Requirement 14']);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Tab');
    await expect(note).toHaveValue('Ask @jon about #14 ');
    await expect(note).toBeFocused();
    await note.pressSequentially('or alice@example.com');
    await expect(list).toBeHidden();
    await expect(page.locator('[data-lab-output="trigger"]')).toHaveText(
      'Ask @jon about #14 or alice@example.com',
    );
    await note.pressSequentially(' @Maria San');
    await expect(list.getByRole('option')).toContainText('Maria Santos');
    await lab.expectAccessible();
  });
});
