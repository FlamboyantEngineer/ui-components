import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

const stepsOf = async (demo: Locator) =>
  JSON.parse((await demo.locator('[data-lab-value]').textContent()) ?? '[]') as Array<{
    id: string;
    kind: string;
    amount: number | null;
  }>;

test.describe('Field Row List lab', () => {
  test('UIC-FIELD-ROW-LIST-1.1 UIC-FIELD-ROW-LIST-1.2 UIC-FIELD-ROW-LIST-1.3 UIC-FIELD-ROW-LIST-2.2 UIC-FIELD-ROW-LIST-2.3 UIC-FIELD-ROW-LIST-3.1 draws rows, bounds and disabled lists', async ({
    page,
    lab,
  }) => {
    await lab.open('field-row-list');
    const empty = page.getByRole('group', { name: 'Labels, empty' });
    await expect(empty.locator('.ui-field-row-list__empty')).toHaveText('No rows yet.');
    const filled = page.getByRole('group', { name: 'Labels, filled' });
    await expect(filled.locator('.ui-field-row-list__number')).toHaveText(['1', '2']);
    await expect(filled.locator('.ui-field-row-list__row').last()).toHaveAttribute(
      'data-key',
      'south',
    );
    await expect(
      filled.getByRole('group', { name: 'Row 2' }).getByRole('textbox', { name: 'Name' }),
    ).toHaveValue('South');
    const atMinimum = page.getByRole('group', { name: 'Labels, at minimum' });
    await expect(atMinimum.getByRole('button', { name: 'Remove row 1' })).toBeDisabled();
    await expect(atMinimum.getByRole('button', { name: 'Add row' })).toBeEnabled();
    const atMaximum = page.getByRole('group', { name: 'Labels, at maximum' });
    await expect(atMaximum.getByRole('button', { name: 'Add row' })).toBeDisabled();
    await expect(atMaximum.getByRole('button', { name: 'Remove row 2' })).toBeEnabled();
    const disabled = page.getByRole('group', { name: 'Labels, disabled' });
    await expect(disabled).toHaveAttribute('data-disabled', 'true');
    await expect(disabled.getByRole('textbox', { name: 'Name' }).first()).toBeDisabled();
    await expect(disabled.getByRole('textbox', { name: 'Name' }).first()).toHaveValue('North');
    const legend = page.getByRole('group', { name: 'Channels' });
    await expect(legend.locator('legend')).toHaveText('Channels');
    await expect(legend.getByRole('button')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-FIELD-ROW-LIST-T1.1 UIC-FIELD-ROW-LIST-2.1 UIC-FIELD-ROW-LIST-2.4 switches a row’s numeric field and adds and removes rows', async ({
    page,
    lab,
  }) => {
    await lab.open('field-row-list');
    const demo = page.locator('[data-lab-demo="typed"]');
    const row = (number: number) => demo.getByRole('group', { name: `Row ${number}` });

    await row(1).getByRole('button', { name: /Kind/ }).click();
    await page.getByRole('option', { name: 'Repeat' }).click();
    const count = row(1).getByRole('textbox', { name: 'Count' });
    await expect(count).toHaveValue('3');
    await expect(row(1).getByRole('textbox', { name: 'Duration (s)' })).toHaveCount(0);
    await expect(row(1)).toContainText('1 to 20');
    await count.fill('40');
    await count.press('Tab');
    await expect(row(1)).toContainText('Enter 20 or less.');
    await expect(count).toHaveAttribute('aria-invalid', 'true');
    await expect(row(2).getByRole('textbox', { name: 'Target (%)' })).toHaveValue('80');

    await demo.getByRole('button', { name: 'Add step' }).click();
    await expect(row(4).getByRole('button', { name: /Kind/ })).toBeFocused();
    await demo.getByRole('button', { name: 'Add step' }).click();
    await expect(demo.getByRole('button', { name: 'Add step' })).toBeDisabled();
    expect((await stepsOf(demo)).map((step) => step.id)).toEqual([
      'warm-up',
      'rise',
      'cycle',
      'step-1',
      'step-2',
    ]);

    await demo.getByRole('button', { name: 'Remove row 2' }).click();
    await expect(row(2).getByRole('textbox', { name: 'Count' })).toHaveValue('4');
    await expect(row(2).getByRole('button', { name: /Kind/ })).toBeFocused();
    expect((await stepsOf(demo)).map((step) => step.id)).toEqual([
      'warm-up',
      'cycle',
      'step-1',
      'step-2',
    ]);
    await lab.expectAccessible();
  });

  test('UIC-FIELD-ROW-LIST-3.1 disables and enables every field of a list', async ({
    page,
    lab,
  }) => {
    await lab.open('field-row-list');
    const demo = page.locator('[data-lab-demo="disabled"]');
    const list = demo.getByRole('group', { name: 'Locked sequence' });
    const target = list.getByRole('textbox', { name: 'Target (%)' });
    await expect(target).toBeDisabled();
    await expect(target).toHaveValue('80');
    await expect(list.getByRole('button', { name: /Kind/ }).first()).toBeDisabled();
    await expect(list.getByRole('button', { name: 'Add step' })).toBeDisabled();
    await demo.getByText('Disable the sequence').click();
    await expect(target).toBeEnabled();
    await target.fill('60');
    await expect(target).toHaveValue('60');
    await expect(list.getByRole('button', { name: 'Remove row 1' })).toBeEnabled();
  });
});
