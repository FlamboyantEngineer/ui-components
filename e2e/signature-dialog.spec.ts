import type { Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

async function settled(page: Page) {
  const overlay = page.locator('.ui-modal.ui-signature-dialog');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
}

test.describe('Signature Dialog lab', () => {
  test('UIC-SIGNATURE-DIALOG-1.1 UIC-SIGNATURE-DIALOG-1.2 UIC-SIGNATURE-DIALOG-1.4 opens every configuration', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    for (const meanings of ['one', 'several']) {
      for (const credentials of ['password', 'username-password']) {
        const cell = matrixCell(page, `meanings=${meanings} credentials=${credentials}`);
        const opener = cell.getByRole('button', { name: 'Sign', exact: true });
        await opener.click();
        const dialog = page.getByRole('dialog', { name: 'Sign Requirement 12' });
        await settled(page);
        await expect(dialog.getByText('Signing as Ada Lovelace')).toBeVisible();
        await expect(dialog.getByRole('radiogroup', { name: 'Meaning of signature' })).toHaveCount(
          meanings === 'several' ? 1 : 0,
        );
        await expect(dialog.getByRole('textbox', { name: 'User name' })).toHaveCount(
          credentials === 'username-password' ? 1 : 0,
        );
        await expect(dialog.locator('input[type="password"]')).toHaveCount(1);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-SIGNATURE-DIALOG-2.1 UIC-SIGNATURE-DIALOG-2.2 validates, shows a refused password, then signs', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    await page.locator('[data-lab-open="change"]').click();
    const dialog = page.getByRole('dialog', { name: 'Sign the release of version 2.4' });
    await settled(page);
    await expect(dialog.locator('.ui-signature-dialog__summary')).toContainText('3 requirements');
    await lab.expectAccessible('.ui-modal');
    const sign = dialog.getByRole('button', { name: 'Sign', exact: true });
    await sign.click();
    await expect(dialog.getByRole('radio', { name: 'Approved' })).toBeFocused();
    await expect(dialog.locator('.ui-field[data-validation="invalid"]')).toHaveCount(2);

    await dialog.getByText('Reviewed', { exact: true }).click();
    await expect(dialog.getByRole('radio', { name: 'Reviewed' })).toBeChecked();
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Checked against the plan');
    const password = dialog.locator('input[type="password"]');
    await password.fill('apple');
    await sign.click();
    await expect(dialog.getByRole('alert')).toHaveText('The password is not right.');
    await expect(password).toHaveValue('');
    await expect(dialog.getByRole('textbox', { name: 'Reason' })).toHaveValue(
      'Checked against the plan',
    );
    await password.fill('orchard');
    await page.keyboard.press('Control+Enter');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-output="signed"]')).toHaveText(
      'Ada Lovelace, review, Checked against the plan',
    );
  });

  test('UIC-SIGNATURE-DIALOG-1.2 follows meanings that change while open', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    await page.locator('[data-lab-open="changing"]').click();
    const dialog = page.getByRole('dialog', { name: 'Sign the updated plan' });
    await settled(page);
    await dialog.getByText('Reviewed', { exact: true }).click();
    const load = dialog.getByRole('button', { name: 'Load the next meanings' });
    await load.click();
    await expect(dialog.getByRole('radio', { name: 'Reviewed' })).toHaveCount(0);
    await expect(dialog.getByRole('radio', { checked: true })).toHaveCount(0);
    await dialog.locator('input[type="password"]').fill('orchard');
    const sign = dialog.getByRole('button', { name: 'Sign', exact: true });
    await sign.click();
    await expect(dialog.getByRole('radio', { name: 'Approved' })).toBeFocused();
    await expect(page.locator('[data-lab-output="changing"]')).toHaveText('none');
    await load.click();
    await expect(dialog.locator('.ui-signature-dialog__meaning')).toHaveText(
      'Meaning of signature: Reviewed',
    );
    await sign.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-output="changing"]')).toHaveText(
      'Ada Lovelace, review, no reason',
    );
  });

  test('UIC-SIGNATURE-DIALOG-2.2 UIC-SIGNATURE-DIALOG-2.3 leaves out entries no longer asked and clears them for another signer', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    await page.locator('[data-lab-open="session"]').click();
    const dialog = page.getByRole('dialog', { name: 'Sign the shift handover' });
    await settled(page);
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Private note');
    const password = dialog.locator('input[type="password"]');
    await password.fill('orchard');
    await dialog.getByRole('button', { name: 'Hand over to Grace Hopper' }).click();
    await expect(password).toHaveValue('');
    await expect(dialog.getByRole('textbox', { name: 'Reason' })).toHaveValue('');
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Private note');
    await dialog.getByRole('button', { name: 'Stop asking for a reason and signature' }).click();
    await expect(dialog.getByRole('textbox', { name: 'Reason' })).toHaveCount(0);
    await password.fill('orchard');
    await dialog.getByRole('button', { name: 'Sign', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-output="session"]')).toHaveText(
      'Grace Hopper, approve, no reason',
    );
  });

  test('UIC-SIGNATURE-DIALOG-1.3 asks for a required reason and drawing', async ({ page, lab }) => {
    await lab.open('signature-dialog');
    const cell = matrixCell(page, 'reason=required drawing=required');
    await cell.getByRole('button', { name: 'Sign', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Sign the inspection report' });
    await settled(page);
    await dialog.getByRole('textbox', { name: 'Reason' }).fill('Annual check');
    await dialog.locator('input[type="password"]').fill('secret');
    await dialog.getByRole('button', { name: 'Sign', exact: true }).click();
    const area = dialog.getByRole('img', { name: 'Signature' });
    await expect(area).toBeFocused();
    await dialog.getByRole('radio', { name: 'Type' }).click();
    await expect(dialog.locator('.ui-signature-pad')).toHaveAttribute('data-mode', 'type');
    await dialog.getByRole('textbox', { name: 'Signature' }).fill('Grace Hopper');
    await dialog.getByRole('button', { name: 'Sign', exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('[data-lab-output="entries-required-required"]')).toHaveText(
      'Grace Hopper, approve, Annual check, typed',
    );
  });

  test('UIC-SIGNATURE-DIALOG-1.1 keeps the dialog readable in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog', { theme: 'dark' });
    await page.locator('[data-lab-open="change"]').click();
    await settled(page);
    await lab.expectAccessible('.ui-modal');
  });
});

test.describe('Signature Dialog sizes and mounting', () => {
  test('UIC-SIGNATURE-DIALOG-1.1 takes every modal size and its own confirm label', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    const viewport = requireDefined(page.viewportSize());
    let previous = 0;
    for (const size of ['sm', 'md', 'lg', 'xl', 'full']) {
      for (const content of ['short', 'long']) {
        const opener = matrixCell(page, `size=${size} content=${content}`).getByRole('button');
        await opener.click();
        const dialog = page.getByRole('dialog', { name: `Sign the bake sheet, ${size}` });
        await settled(page);
        const box = requireDefined(await dialog.boundingBox());
        if (content === 'short') expect(box.width).toBeGreaterThan(previous);
        previous = box.width;
        expect(box.height).toBeLessThanOrEqual(viewport.height);
        if (size === 'full') expect(box.width).toBeGreaterThan(viewport.width - 48);
        const body = dialog.locator('.ui-modal__body');
        const scrolls = await body.evaluate((node) => node.scrollHeight > node.clientHeight);
        expect(scrolls).toBe(content === 'long');
        await expect(dialog.getByRole('button', { name: 'Sign and serve' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
    }
  });

  test('UIC-SIGNATURE-DIALOG-1.1 opens on mount with defaultOpen, closes and opens again', async ({
    page,
    lab,
  }) => {
    await lab.open('signature-dialog');
    const demo = page.locator('[data-lab-demo="open-on-mount"]');
    const dialog = page.getByRole('dialog', { name: 'Sign the opening checklist' });
    await expect(dialog).toHaveCount(0);
    await demo.getByRole('button', { name: 'Mount the dialog open' }).click();
    await settled(page);
    await expect(dialog.getByRole('button', { name: 'Sign the checklist' })).toBeVisible();
    await lab.expectAccessible('.ui-signature-dialog');
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(demo.locator('[data-lab-output="dialog"]')).toHaveText('closed');
    await demo.getByRole('button', { name: 'Mount the dialog open' }).click();
    await settled(page);
    await expect(demo.locator('[data-lab-output="dialog"]')).toHaveText('open');
    await expect(demo.locator('[data-lab-output="mounts"]')).toHaveText('2');
  });
});
