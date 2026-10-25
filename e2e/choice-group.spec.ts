import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-family="single"] [data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-family="single"] [data-lab-output="${name}"]`);
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('The element has no layout box.');
  return box;
}

test.describe('Choice Group lab', () => {
  test('UIC-CHOICE-GROUP-1.2 renders swapped radio elements with their state', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const crate = field(page, 'swapped');
    const small = crate.locator('.ui-choice').filter({ hasText: 'Small crate' });
    const large = crate.locator('.ui-choice').filter({ hasText: 'Large crate' });
    await expect(small).toHaveAttribute('data-lab-picked', 'yes');
    await large.getByText('Large crate').click();
    await expect(large).toHaveAttribute('data-lab-picked', 'yes');
    await expect(small).toHaveAttribute('data-lab-picked', 'no');
  });

  test('UIC-CHOICE-GROUP-2.1 UIC-CHOICE-GROUP-2.2 enters on the selected radio and moves with the arrows past disabled radios', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const plans = field(page, 'plans');
    const before = page
      .locator('[data-lab-family="single"] [data-lab-cell="size=lg orientation=horizontal"]')
      .getByRole('radio', { name: 'Pear' });
    await before.focus();
    await page.keyboard.press('Tab');
    const team = plans.getByRole('radio', { name: 'Team €19 a month' });
    await expect(team).toBeFocused();
    await expect(team.locator('xpath=ancestor::label')).toHaveAttribute(
      'data-focus-visible',
      'true',
    );
    await page.keyboard.press('ArrowUp');
    const solo = plans.getByRole('radio', { name: 'Solo €4 a month' });
    await expect(solo).toBeFocused();
    await expect(solo).toBeChecked();
    await expect(output(page, 'Plan')).toHaveText('solo');
    await page.keyboard.press('ArrowDown');
    await expect(team).toBeChecked();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(solo).toBeFocused();
    await expect(output(page, 'Plan')).toHaveText('solo');
    await expect(plans.getByRole('radio', { name: 'Family €9 a month' })).toBeDisabled();
    await page.keyboard.press('Tab');
    await expect(
      field(page, 'required').getByRole('radio', { name: 'Pick up in store' }),
    ).toBeFocused();
    await plans.getByText('Kitchen').click();
    await expect(output(page, 'Plan')).toHaveText('kitchen');
    await lab.expectAccessible();
  });

  test('UIC-CHOICE-GROUP-1.1 UIC-CHOICE-GROUP-1.3 UIC-CHOICE-GROUP-1.4 lays out descriptions and orientations', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const plans = field(page, 'plans');
    const solo = plans.locator('.ui-choice').first();
    const label = await boxOf(solo.locator('.ui-choice__label'));
    const description = await boxOf(solo.locator('.ui-choice__description'));
    expect(description.y).toBeGreaterThanOrEqual(label.y + label.height - 1);
    expect(Math.abs(description.x - label.x)).toBeLessThanOrEqual(1);
    await expect(plans.getByRole('radio', { name: 'Solo €4 a month' })).toHaveAccessibleDescription(
      'One cook, unlimited recipes.',
    );
    const row = page.locator(
      '[data-lab-family="single"] [data-lab-cell="size=md orientation=horizontal"]',
    );
    const apple = await boxOf(row.locator('.ui-choice', { hasText: 'Apple' }));
    const pear = await boxOf(row.locator('.ui-choice', { hasText: 'Pear' }));
    expect(Math.abs(apple.y - pear.y)).toBeLessThanOrEqual(1);
    expect(pear.x).toBeGreaterThan(apple.x + apple.width);
    const column = page.locator(
      '[data-lab-family="single"] [data-lab-cell="size=md orientation=vertical"]',
    );
    const first = await boxOf(column.locator('.ui-choice', { hasText: 'Apple' }));
    const second = await boxOf(column.locator('.ui-choice', { hasText: 'Pear' }));
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
    const small = await boxOf(
      page
        .locator(
          '[data-lab-family="single"] [data-lab-cell="size=sm orientation=vertical"] .ui-choice__indicator',
        )
        .first(),
    );
    const large = await boxOf(
      page
        .locator(
          '[data-lab-family="single"] [data-lab-cell="size=lg orientation=vertical"] .ui-choice__indicator',
        )
        .first(),
    );
    expect(large.width).toBeGreaterThan(small.width);
  });

  test('UIC-CHOICE-GROUP-3.1 UIC-CHOICE-GROUP-3.2 blocks a required group in a form until a radio is picked', async ({
    page,
    lab,
  }) => {
    await lab.open('choice-group');
    const required = field(page, 'required');
    const group = required.getByRole('radiogroup', { name: 'Delivery' });
    await page.getByRole('button', { name: 'Order' }).click();
    await expect(output(page, 'Delivery')).toHaveText('none');
    await expect(group).toHaveAttribute('aria-invalid', 'true');
    await expect(required.locator('.ui-field__message')).toHaveText('A value is required.');
    await expect(required.getByRole('radio', { name: 'Pick up in store' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(required.getByRole('radio', { name: 'Courier' })).toBeChecked();
    await expect(group).not.toHaveAttribute('aria-invalid');
    await page.getByRole('button', { name: 'Order' }).click();
    await expect(output(page, 'Delivery')).toHaveText('courier');
  });

  test('UIC-CHOICE-GROUP-3.1 restores, undoes and clears from the menu', async ({ page, lab }) => {
    await lab.open('choice-group');
    const saved = field(page, 'saved');
    await saved.getByText('Apple').click();
    await expect(saved).toHaveAttribute('data-dirty', 'true');
    await saved.getByRole('button', { name: 'Restore Snack' }).click();
    await expect(saved.getByRole('radio', { name: 'Pear' })).toBeChecked();
    await expect(saved.getByRole('radio', { name: 'Pear' })).toBeFocused();
    await page.keyboard.press('ControlOrMeta+z');
    await expect(saved.getByRole('radio', { name: 'Apple' })).toBeChecked();
    await expect(saved.getByRole('radio', { name: 'Apple' })).toBeFocused();
    await saved.getByRole('button', { name: 'Snack actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear' }).click();
    await expect(saved.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(output(page, 'Snack')).toHaveText('none');
  });
});
