import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-inline-edit`;
const field = (name: string) => `[data-lab-demo="recipe"] [data-lab-field="${name}"]`;

test.describe('Inline Edit lab', () => {
  test('UIC-INLINE-EDIT-1.1 UIC-INLINE-EDIT-1.2 shows values and opens the editor in place', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-edit');
    const value = page.locator(cell('state=value buttons=without'));
    await expect(value.locator('.ui-inline-edit__value')).toHaveText('Seeded rye loaf');
    const empty = page.locator(cell('state=empty buttons=without'));
    await expect(empty).toHaveAttribute('data-empty', 'true');
    await expect(empty.locator('.ui-inline-edit__placeholder')).toHaveText('Add a title');
    await expect(page.locator(cell('state=editing buttons=with'))).toHaveAttribute(
      'data-editing',
      'true',
    );
    await expect(
      page.locator(cell('state=disabled buttons=without')).getByRole('button'),
    ).toBeDisabled();
    await value.getByRole('button').click();
    await expect(value).toHaveAttribute('data-editing', 'true');
    const input = value.getByRole('textbox');
    await expect(input).toBeFocused();
    expect(await input.evaluate((element: HTMLInputElement) => element.selectionEnd)).toBe(15);
    await page.keyboard.press('Escape');
    await expect(value.getByRole('button')).toBeFocused();
    await page.keyboard.press('F2');
    await expect(input).toBeFocused();
  });

  test('UIC-INLINE-EDIT-1.3 UIC-INLINE-EDIT-1.4 UIC-INLINE-EDIT-1.6 saves after a pending save', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-edit');
    const title = page.locator(field('title'));
    await title.getByRole('button', { name: /^Edit Title/ }).click();
    await page.keyboard.type('Wholegrain loaf');
    await page.keyboard.press('Enter');
    await expect(title).toHaveAttribute('data-pending', 'true');
    await expect(title.getByRole('button', { name: /^Edit Title/ })).toBeFocused();
    await expect(title.locator('.ui-inline-edit__value')).toHaveText('Wholegrain loaf');
    await expect(title).not.toHaveAttribute('data-pending');
    const servings = page.locator(field('servings'));
    await servings.getByRole('button', { name: /^Edit Servings/ }).click();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(servings.locator('.ui-inline-edit__value')).toHaveText('9 servings');
  });

  test('UIC-INLINE-EDIT-1.6 keeps the editor open with a failed save', async ({ page, lab }) => {
    await lab.open('inline-edit');
    const title = page.locator(field('title'));
    await title.getByRole('button', { name: /^Edit Title/ }).click();
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Enter');
    const error = title.getByRole('alert');
    await expect(error).toHaveText('A title is required.');
    await expect(title).toHaveAttribute('data-invalid', 'true');
    await expect(title.getByRole('textbox', { name: 'Title' })).toHaveValue('');
    await page.keyboard.press('Escape');
    await expect(title.locator('.ui-inline-edit__value')).toHaveText('Seeded rye loaf');
    await expect(title).not.toHaveAttribute('data-invalid');
  });

  test('UIC-INLINE-EDIT-1.4 UIC-INLINE-EDIT-1.5 saves on leaving and a select saves its choice', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-edit');
    const notes = page.locator(field('notes'));
    await notes.getByRole('button', { name: /^Edit Notes/ }).click();
    await page.keyboard.press('Enter');
    await page.keyboard.type('Bake hot.');
    await expect(notes).toHaveAttribute('data-editing', 'true');
    await page.locator('[data-lab-demo="recipe"] dt').first().click();
    await expect(notes.locator('.ui-inline-edit__value')).toHaveText(
      'Rest the dough overnight.\nBake hot.',
    );
    const cuisine = page.locator(field('cuisine'));
    await cuisine.getByRole('button', { name: /^Edit Cuisine/ }).click();
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Japanese' }).click();
    await expect(cuisine.locator('.ui-inline-edit__value')).toHaveText('Japanese');
  });

  test('UIC-INLINE-EDIT-1.6 saves a cleared choice queued behind a pending choice', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-edit');
    const cuisine = page.locator(field('cuisine'));
    await cuisine.getByRole('button', { name: /^Edit Cuisine/ }).click();
    await page.keyboard.press('Enter');
    await page.getByRole('option', { name: 'Italian' }).click();
    await expect(cuisine).toHaveAttribute('data-pending');
    await cuisine.getByRole('button', { name: 'Clear cuisine' }).click();
    await expect(cuisine.locator('.ui-inline-edit__placeholder')).toHaveText('No cuisine');
    await expect(cuisine).not.toHaveAttribute('data-pending');
  });

  test('UIC-INLINE-EDIT-1.7 saves a date with the save button', async ({ page, lab }) => {
    await lab.open('inline-edit');
    const bakeOn = page.locator(field('bake-on'));
    await bakeOn.getByRole('button', { name: /^Edit Bake on/ }).click();
    const save = bakeOn.getByRole('button', { name: 'Save' });
    await expect(bakeOn.locator('.ui-inline-edit__cancel')).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await save.click();
    await expect(bakeOn.locator('.ui-inline-edit__value')).toHaveText('Jun 2, 2026');
  });

  test('UIC-INLINE-EDIT-2.1 names the read view and passes axe', async ({ page, lab }) => {
    await lab.open('inline-edit');
    await expect(
      page.locator(field('title')).getByRole('button', { name: 'Edit Title Seeded rye loaf' }),
    ).toBeVisible();
    await page.locator(cell('state=value buttons=with')).getByRole('button').click();
    await lab.expectAccessible();
    await lab.open('inline-edit', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-INLINE-EDIT-1.6 keeps and saves text typed while a save runs', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-edit');
    const title = page.locator(field('title'));
    await title.getByRole('button').click();
    const input = title.getByRole('textbox');
    await input.fill('Spelt');
    await input.press('Enter');
    await expect(title).toHaveAttribute('data-pending', 'true');
    await input.press('End');
    await page.keyboard.type(' loaf');
    await page.keyboard.press('Enter');
    await expect(title).not.toHaveAttribute('data-editing');
    await expect(title.locator('.ui-inline-edit__value')).toHaveText('Spelt loaf');
  });
});
