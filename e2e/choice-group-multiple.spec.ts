import type { Locator, Page } from '@playwright/test';
import { cellSelector, expect, familySelector, test } from './fixtures.js';

function cell(page: Page, state: string, layout = 'label-control'): Locator {
  return page.locator(
    `${familySelector('multiple')} ${cellSelector(`state=${state} layout=${layout}`)}`,
  );
}

function field(page: Page, name: string): Locator {
  return page.locator(`${familySelector('multiple')} [data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`${familySelector('multiple')} [data-lab-output="${name}"]`);
}

test.describe('Choice Group multiple lab', () => {
  test('UIC-CHOICE-GROUP-4.1 UIC-CHOICE-GROUP-4.3 stacks the options of a named group in each state', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const resting = cell(page, 'resting').getByRole('group', { name: 'Fruit' });
    const apple = await resting.getByRole('checkbox', { name: 'Apple' }).boundingBox();
    const pear = await resting.getByRole('checkbox', { name: 'Pear' }).boundingBox();
    expect(pear?.y ?? 0).toBeGreaterThan(apple?.y ?? 0);
    await expect(resting.getByRole('checkbox', { name: 'Apple' })).toBeChecked();
    const required = cell(page, 'required').getByRole('group', { name: 'Fruit' });
    await expect(required).toHaveAccessibleDescription('A value is required.');
    await expect(required).toHaveAttribute('data-invalid', 'true');
    await required.getByText('Plum').click();
    await expect(required).not.toHaveAttribute('data-invalid');
    await expect(cell(page, 'disabled').getByRole('checkbox', { name: 'Pear' })).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-CHOICE-GROUP-4.4 ticks and clears every enabled option from the parent box', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const group = field(page, 'select-all');
    const parent = group.getByRole('checkbox', { name: 'All toppings' });
    await expect(parent).toBeChecked({ indeterminate: true });
    await group.getByText('All toppings').click();
    await expect(parent).toBeChecked();
    await expect(output(page, 'Toppings')).toHaveText('olives, basil, peppers');
    await expect(group.getByRole('checkbox', { name: 'Truffle (sold out)' })).not.toBeChecked();
    await page.keyboard.press('Space');
    await expect(parent).not.toBeChecked();
    await expect(output(page, 'Toppings')).toHaveText('none');
  });

  test('UIC-CHOICE-GROUP-4.5 restores, undoes, clears and submits', async ({ page, lab }) => {
    await lab.open('choice-group');
    const saved = field(page, 'saved');
    await saved.getByText('Apple').click();
    await expect(saved).toHaveAttribute('data-dirty', 'true');
    await saved.getByRole('button', { name: 'Restore Basket' }).click();
    await expect(saved.getByRole('checkbox', { name: 'Apple' })).not.toBeChecked();
    await expect(saved.getByRole('checkbox', { name: 'Apple' })).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(saved.getByRole('checkbox', { name: 'Apple' })).toBeChecked();
    await saved.getByRole('button', { name: 'Basket actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(saved.getByRole('checkbox', { checked: true })).toHaveCount(0);
    await saved.getByText('Plum').click();
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Submitted')).toHaveText('plum');
  });

  test('UIC-CHOICE-GROUP-3.3 submits a ticked disabled choice and drops a removed one', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const changing = field(page, 'changing');
    const send = page.getByRole('button', { name: 'Send picked fruit' });
    await send.click();
    await expect(output(page, 'Picked fruit sent')).toHaveText('plum, pear');
    await page.getByRole('button', { name: 'Remove Plum' }).click();
    await send.click();
    await expect(output(page, 'Picked fruit sent')).toHaveText('pear');
    await page.getByRole('button', { name: 'Restore Plum' }).click();
    await expect(changing.getByRole('checkbox', { name: 'Plum' })).toBeChecked();
  });
});
