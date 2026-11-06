import type { Locator, Page } from '@playwright/test';
import { controlHeight, expect, matrixCell, test } from './fixtures.js';

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

function output(page: Page, name: string): Locator {
  return page.locator(`[data-lab-output="${name}"]`);
}

function panel(page: Page, name: string): Locator {
  return page.getByRole('listbox', { name });
}

test.describe('Cascader Field lab', () => {
  test('UIC-CASCADER-FIELD-1.1 names the trigger by the label and path in every state', async ({
    page,
    lab,
  }) => {
    await lab.open('cascader-field');
    const resting = matrixCell(page, 'state=resting layout=label-control');
    const trigger = resting.locator('.ui-cascader-field__trigger');
    await expect(trigger).toHaveAccessibleName('Place North / Lakes / Pine Harbour');
    expect((await trigger.boundingBox())?.height).toBe(await controlHeight(page, 'md'));
    await expect(
      matrixCell(page, 'state=required layout=label-control').locator('.ui-cascader-field__value'),
    ).toHaveAttribute('data-placeholder', 'true');
    await expect(
      field(page, 'unknown').locator('.ui-cascader-field__trigger'),
    ).toHaveAccessibleName('Restored North / gone');
    const readOnly = matrixCell(page, 'state=read-only layout=label-control').locator(
      '.ui-cascader-field__trigger',
    );
    await readOnly.click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      matrixCell(page, 'state=disabled layout=label-control').locator(
        '.ui-cascader-field__trigger',
      ),
    ).toBeDisabled();
    await lab.expectAccessible();
  });

  test('UIC-CASCADER-FIELD-2.1 UIC-CASCADER-FIELD-2.2 opens levels side by side with the keyboard and chooses a leaf', async ({
    page,
    lab,
  }) => {
    await lab.open('cascader-field');
    const trigger = field(page, 'choosing').locator('.ui-cascader-field__trigger');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(panel(page, 'Destination').getByRole('option', { name: 'North' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(panel(page, 'North').getByRole('option', { name: 'Lakes' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    const lakes = panel(page, 'Lakes');
    await expect(lakes.getByRole('option', { name: 'Pine Harbour' })).toBeFocused();
    // The levels sit beside one another, each after the last.
    const top = await panel(page, 'Destination').boundingBox();
    const deepest = await lakes.boundingBox();
    expect(deepest && top && deepest.x > top.x).toBe(true);
    await lab.expectAccessible();
    await page.keyboard.press('ArrowDown');
    await expect(lakes.getByRole('option', { name: /^Reed Point/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAccessibleName('Destination North / Lakes / Reed Point');
    await expect(output(page, 'Committed')).toHaveText('["north","lakes","reed"]');
  });

  test('UIC-CASCADER-FIELD-2.1 mirrors the arrows and the panels right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('cascader-field');
    const trigger = page.getByRole('button', { name: /^RTL/ });
    await trigger.click();
    await expect(page.getByRole('option', { name: 'Pine Harbour' })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('option', { name: 'Lakes' })).toBeFocused();
    const top = await page.getByRole('listbox', { name: 'RTL' }).boundingBox();
    const next = await page.getByRole('listbox', { name: 'North' }).boundingBox();
    expect(top && next && next.x < top.x).toBe(true);
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  });

  test('UIC-CASCADER-FIELD-3.1 loads a level, retries a failure and keeps a replaced value', async ({
    page,
    lab,
  }) => {
    await lab.open('cascader-field');
    const trigger = field(page, 'loading').locator('.ui-cascader-field__trigger');
    await trigger.click();
    await page.getByRole('option', { name: 'Unreachable' }).click();
    const status = page.getByRole('dialog').getByRole('status');
    await expect(status).toHaveText('Loading');
    await expect(status).toContainText('Could not load these options');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(status).toHaveText('Loading');
    await expect(status).toContainText('Could not load these options');
    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(
      panel(page, 'Unreachable').getByRole('option', { name: 'Unreachable Market' }),
    ).toBeVisible();
    await page.getByRole('option', { name: 'East' }).click();
    await expect(page.getByRole('option', { name: 'East Market' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Choose East Market' }).click();
    await expect(trigger).toHaveAccessibleName('Branch office East / East Market');
    await expect(output(page, 'Loads')).toHaveText('faulty faulty faulty east');
  });

  test('UIC-CASCADER-FIELD-1.3 clears with Backspace, then submits and resets the leaf id', async ({
    page,
    lab,
  }) => {
    await lab.open('cascader-field');
    const form = page.locator('form').filter({ has: page.getByRole('button', { name: /^Stop/ }) });
    const trigger = form.getByRole('button', { name: /^Stop/ });
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Form')).toHaveText('stop=oak');
    await trigger.focus();
    await page.keyboard.press('Backspace');
    await expect(trigger).toHaveAccessibleName('Stop Select an option');
    await form.getByRole('button', { name: 'Submit' }).click();
    await expect(output(page, 'Form')).toHaveText('stop=');
    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(trigger).toHaveAccessibleName('Stop North / Hills / Oak Rise');
  });
});
