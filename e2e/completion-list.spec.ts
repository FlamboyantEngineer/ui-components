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

  test('UIC-COMPLETION-LIST-2.2 closes the kept options when the next lookup fails', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('completion-list');
    const demo = page.locator('[data-lab-demo="failed-lookup"]');
    const field = demo.getByRole('textbox', { name: 'Nut' });
    // The list is portalled out of the demo: find it through the field.
    const options = async () =>
      page
        .locator(`[id="${(await field.getAttribute('aria-controls')) ?? 'none'}"]`)
        .getByRole('option');
    await field.focus();
    await field.press('a');
    await page.clock.runFor(600);
    await expect(field).toHaveAttribute('aria-controls');
    await expect(await options()).toHaveText(['almond', 'alpha nut']);
    await field.press('l');
    await expect(await options()).toHaveText(['almond', 'alpha nut']);
    await page.clock.runFor(600);
    await expect(field).not.toHaveAttribute('aria-controls');
    await field.fill('');
    await field.press('a');
    await page.clock.runFor(600);
    await expect(field).toHaveAttribute('aria-controls');
    await expect(await options()).toHaveText(['almond', 'alpha nut']);
  });

  test('UIC-COMPLETION-LIST-2.7 drops a late answer from completions the host switched', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('completion-list');
    const demo = page.locator('[data-lab-demo="switched"]');
    const field = demo.getByRole('textbox', { name: 'Name' });
    // Other demos on the page draw lists of their own.
    const options = () => page.locator('.ui-text-field__completions').getByRole('option');
    await field.focus();
    await field.press('End');
    await field.press('Control+Space');
    // A script click switches the source while the field keeps focus.
    await demo.getByRole('button', { name: 'Complete colours' }).evaluate((button: HTMLElement) => {
      button.click();
    });
    await expect(options()).toHaveText(['blue', 'brown']);
    await page.clock.runFor(2000);
    await expect(options()).toHaveText(['blue', 'brown']);
    await demo.getByRole('button', { name: 'Complete planets' }).evaluate((button: HTMLElement) => {
      button.click();
    });
    await expect(field).not.toHaveAttribute('aria-controls');
    await page.clock.runFor(2000);
    await expect(options()).toHaveText(['Bellatrix', 'Betelgeuse']);
    // The answer can resolve at the clock's final tick; give its list the frame it reports as shown.
    await page.clock.runFor(32);
    await expect(field).toHaveAttribute(
      'aria-activedescendant',
      (await options().first().getAttribute('id')) ?? '',
    );
    await field.press('Enter');
    await expect(field).toHaveValue('Bellatrix');
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

  test('UIC-COMPLETION-LIST-1.3 preserves the first completion beneath a stationary pointer', async ({
    page,
    lab,
  }) => {
    await lab.open('completion-list');
    const input = editor(page, 'labels-none');
    await input.focus();
    const london = page.getByRole('option', { name: 'London', exact: true });
    await expect(london).toBeVisible();
    const bounds = await london.boundingBox();
    if (!bounds) throw new Error('The second completion has no bounds.');
    await input.press('Escape');
    await expect(london).toBeHidden();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await input.pressSequentially('L');
    await expect(london).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect(page.getByRole('option', { name: 'Lisbon', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(london).toHaveAttribute('aria-selected', 'false');
    await input.press('Enter');
    await expect(input).toHaveValue('Lisbon');
    await input.fill('L');
    await expect(london).toBeVisible();
    await expect(page.locator('.ui-completion-list').filter({ has: london })).not.toHaveAttribute(
      'data-entering',
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    const reopened = await london.boundingBox();
    if (!reopened) throw new Error('The reopened second completion has no bounds.');
    await page.mouse.move(reopened.x + reopened.width / 2 + 3, reopened.y + reopened.height / 2);
    await expect(london).toHaveAttribute('aria-selected', 'true');
    await input.press('Enter');
    await expect(input).toHaveValue('London');
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

test('UIC-COMPLETION-LIST-1.2 UIC-PORTAL-1.8 scrolls the active option into view inside a shadow root', async ({
  page,
  lab,
}) => {
  await lab.open('completion-list');
  const demo = page.locator('[data-lab-demo="shadow-completions"]');
  await demo.scrollIntoViewIfNeeded();
  await demo.getByRole('combobox', { name: 'Shadow city' }).focus();
  const list = demo.getByRole('listbox');
  await expect(list).toBeVisible();
  await page.keyboard.press('ArrowUp');
  const active = list.locator('[role="option"][aria-selected="true"]');
  await expect(active).toBeInViewport();
  expect(await list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
});
