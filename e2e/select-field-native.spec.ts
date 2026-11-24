import type { Locator, Page } from '@playwright/test';
import { cellSelector, expect, familySelector, test } from './fixtures.js';

function demo(page: Page, name: string): Locator {
  return page.locator(`${familySelector('native')} [data-lab-demo="${name}"]`);
}

test.describe('Select Field native lab', () => {
  test('UIC-SELECT-FIELD-14.1 draws a labelled native select in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const cells = page.locator(
      `${familySelector('native')} table[data-lab-matrix="state layout"] td[data-lab-cell]`,
    );
    expect(await cells.count()).toBe(8 * 4);
    const selects = page.locator(`${familySelector('native')} select.ui-select-field__native`);
    expect(await selects.count()).toBeGreaterThanOrEqual(8 * 4);
    const disabled = page.locator(
      `${familySelector('native')} ${cellSelector('state=disabled layout=label-control')} select`,
    );
    await expect(disabled).toBeDisabled();
    await lab.expectAccessible(familySelector('native'));
  });

  test('UIC-SELECT-FIELD-14.3 keeps the choice while sources change and falls back to the placeholder', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const section = demo(page, 'changing-options');
    const select = section.getByRole('combobox', { name: 'Source' });
    await expect(select).toHaveValue('source-b');
    await select.selectOption({ label: 'Source C' });
    await expect(section.locator('[data-lab-output="Source"]')).toHaveText('source-c');
    await section.getByRole('button', { name: 'Add a source' }).click();
    await expect(select).toHaveValue('source-c');
    await section.getByRole('button', { name: 'Remove every source' }).click();
    await expect(select).toHaveValue('');
    await expect(select.locator('option')).toHaveText(['No source available']);
    await expect(select).toHaveAttribute('aria-invalid', 'true');
    await expect(select).toHaveAttribute('data-placeholder', 'true');
    for (let index = 0; index < 3; index += 1) {
      await section.getByRole('button', { name: 'Add a source' }).click();
    }
    await expect(select).toHaveValue('source-c');
    await expect(select).not.toHaveAttribute('aria-invalid');
    await expect(section.locator('[data-lab-output="Source"]')).toHaveText('source-c');
  });

  test('UIC-SELECT-FIELD-14.2 UIC-SELECT-FIELD-14.4 submits, requires and locks with its fieldset', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const form = demo(page, 'native-form');
    const rate = form.getByRole('combobox', { name: 'Rate' });
    const output = form.locator('[data-lab-output="Form"]');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output).toHaveText('none');
    await expect(rate).toHaveAttribute('aria-invalid', 'true');
    await expect(rate).toBeFocused();
    expect(await rate.evaluate((select: HTMLSelectElement) => select.validity.valid)).toBe(false);
    await expect(rate.locator('option[value="burst"]')).toBeDisabled();
    await rate.focus();
    await rate.press('ArrowDown');
    await expect(rate).not.toHaveValue('');
    await rate.selectOption({ label: 'Fast, 100 per second' });
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output).toHaveText('rate=fast trigger=minute');
    await form.getByRole('combobox', { name: 'Trigger' }).selectOption({ label: 'None' });
    await form.getByRole('button', { name: 'Disable the fieldset' }).click();
    await expect(rate).toBeDisabled();
    await expect(rate).toHaveValue('fast');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output).toHaveText('empty');
    await form.getByRole('button', { name: 'Enable the fieldset' }).click();
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output).toHaveText('rate=fast trigger=');
  });

  test('UIC-SELECT-FIELD-14.4 keeps a read-only select on its value from the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const select = page
      .locator(
        `${familySelector('native')} ${cellSelector('state=read-only layout=label-control')}`,
      )
      .getByRole('combobox');
    await select.focus();
    await select.press('ArrowDown');
    await select.press('f');
    await expect(select).toHaveValue('slow');
    await expect(select).toBeFocused();
  });

  test('UIC-SELECT-FIELD-14.2 UIC-SELECT-FIELD-14.4 accepts a real empty-string id and rejects the placeholder', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const form = demo(page, 'native-empty-id');
    const select = form.getByRole('combobox', { name: 'Channel' });
    const selected = select.locator('option:checked');
    await expect(selected).toHaveText('Unnumbered');
    expect(await select.evaluate((control: HTMLSelectElement) => control.validity.valid)).toBe(
      true,
    );
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(form.locator('[data-lab-output="Channel entry"]')).toHaveText('""');
    await select.selectOption({ label: 'None' });
    await expect(selected).toHaveText('None');
    expect(
      await select.evaluate((control: HTMLSelectElement) => control.validity.valueMissing),
    ).toBe(true);
    await expect(select).toHaveAttribute('data-placeholder', 'true');
    await select.selectOption({ label: 'Unnumbered' });
    await expect(selected).toHaveText('Unnumbered');
    expect(await select.evaluate((control: HTMLSelectElement) => control.validity.valid)).toBe(
      true,
    );
  });

  test('UIC-SELECT-FIELD-14.1 reads and focuses the native select through its ref', async ({
    page,
    lab,
  }) => {
    await lab.open('select-field');
    const section = demo(page, 'select-ref');
    await section.getByRole('button', { name: 'Read and focus the channel' }).click();
    await expect(section.locator('[data-lab-output="Read"]')).toHaveText('source-a');
    await expect(section.getByRole('combobox', { name: 'Channel' })).toBeFocused();
  });
});
