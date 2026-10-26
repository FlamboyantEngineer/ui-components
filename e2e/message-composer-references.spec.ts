import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const references = (page: Page) => page.locator('[data-lab-composer="references"]');
const chips = (page: Page) =>
  references(page).locator('.ui-message-composer__pill[data-kind="reference"]');

/** Inserts a sample record from the composer's "+" menu. */
async function insertReference(page: Page, label: string) {
  await references(page).getByRole('button', { name: 'Add and more' }).click();
  await page.getByRole('menuitem', { name: new RegExp(`Reference ${label}`) }).click();
  await expect(references(page).getByRole('textbox')).toBeFocused();
}

test.describe('Message Composer references', () => {
  test('UIC-MESSAGE-COMPOSER-4.9 UIC-MESSAGE-COMPOSER-5.3 draws, inserts and sends references with their ids', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    await expect(chips(page)).toHaveCount(2);
    await expect(chips(page).first().getByRole('link')).toHaveText('TRIP-4 Lisbon weekend');
    await expect(chips(page).first().getByRole('link')).toHaveAttribute('href', '#trip-4');
    await references(page).getByRole('textbox').press('End');
    await insertReference(page, 'NOTE-9');
    await expect(chips(page).last().locator('.ui-record-label')).toHaveAttribute(
      'data-unavailable',
      'missing',
    );
    await page.keyboard.press('Enter');
    const sent = page.locator('[data-lab-sent="1"]');
    await expect(sent.locator('.ui-chat-parts__token[data-kind="reference"]')).toHaveCount(3);
    await expect(sent.locator('[data-lab-tokens]')).toContainText(
      'reference 7c2e4f10-9b1a-4d3e-8f6a-2b5c1d0e9a47 14–20',
    );
    await expect(sent.locator('[data-lab-tokens]')).toContainText(
      'reference 0d41b7e2-6c5f-4e9a-a3b8-7f1d2c4e5a90',
    );
    await insertReference(page, 'TRIP-2');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-lab-sent="2"] [data-lab-tokens]')).toHaveText(
      '(reference 55b0e9c1-3a7d-4f2b-9e6c-8d4a1b7f3c25 0–6)',
    );
    await lab.expectAccessible('[data-lab-section="Record references"]');
  });

  test('UIC-MESSAGE-COMPOSER-4.9 UIC-MESSAGE-COMPOSER-4.3 removes a reference with its button or Backspace and undoes it', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const box = references(page).getByRole('textbox');
    await references(page).getByRole('button', { name: 'Remove TRIP-4' }).click();
    await expect(chips(page)).toHaveCount(1);
    await expect(box).toBeFocused();
    await page.keyboard.press('Control+z');
    await expect(chips(page)).toHaveCount(2);
    await box.press('End');
    for (const _ of ' first') await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await expect(chips(page)).toHaveCount(1);
    await expect(references(page).getByRole('status')).toHaveText('NOTE-12 removed');
  });

  test('UIC-MESSAGE-COMPOSER-4.9 UIC-MESSAGE-COMPOSER-3.6 keeps references through a refused send, a remount and a reload', async ({
    page,
    lab,
  }) => {
    await lab.open('message-composer');
    const box = references(page).getByRole('textbox');
    await box.press('End');
    await insertReference(page, 'NOTE-9');
    await page.getByText('Reject sends', { exact: true }).click();
    await box.press('Enter');
    await expect(page.getByText('Error: The host refused the message.')).toBeVisible();
    await expect(chips(page)).toHaveCount(3);
    await page.getByRole('button', { name: 'Remount the composer' }).click();
    await expect(chips(page)).toHaveCount(3);
    await page.reload();
    await expect(chips(page)).toHaveCount(3);
    await expect(chips(page).last()).toHaveText('Missing item');
  });

  test('UIC-MESSAGE-COMPOSER-4.9 copies a reference as its label', async ({
    page,
    lab,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await lab.open('message-composer');
    await references(page)
      .getByRole('textbox')
      .click({ position: { x: 4, y: 4 } });
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.press('ControlOrMeta+c');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'Please review TRIP-4 and NOTE-12 first',
    );
  });
});
