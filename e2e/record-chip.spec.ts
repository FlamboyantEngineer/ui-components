import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-record-chip`;

test.describe('Record Chip lab', () => {
  test('UIC-RECORD-CHIP-1.1 UIC-RECORD-CHIP-1.2 lays out the parts inline or stacked', async ({
    page,
    lab,
  }) => {
    await lab.open('record-chip');
    const inline = page.locator(cell('parts=details layout=inline'));
    await expect(inline).toHaveText('REQ-12 Brake pressure limits v3 Requirement Approved');
    const label = await inline.locator('.ui-record-chip__label').boundingBox();
    const state = await inline.locator('.ui-record-chip__state').boundingBox();
    expect(
      label && state && Math.abs(label.y + label.height / 2 - (state.y + state.height / 2)),
    ).toBeLessThan(4);

    const stacked = page.locator(cell('parts=details layout=stacked'));
    await expect(stacked).toHaveAttribute('data-layout', 'stacked');
    const header = await stacked.locator('.ui-record-chip__header').boundingBox();
    const name = await stacked.locator('.ui-record-chip__name').boundingBox();
    expect(header && name && name.y >= header.y + header.height - 1).toBe(true);
    await expect(stacked.getByRole('link', { name: 'REQ-12' })).toHaveAccessibleDescription(
      'Brake pressure limits',
    );
  });

  test('UIC-RECORD-CHIP-1.3 previews a record on hover and on keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('record-chip');
    const card = page.locator('.ui-record-chip__preview');
    await page.mouse.move(5, 5);
    await page.locator(cell('link=same tab')).getByRole('link').hover();
    await expect(card).toContainText('Risk, owned by Lena Ortiz');
    await page.mouse.move(5, 5);
    await expect(card).toHaveCount(0);

    const external = page.locator(cell('link=new tab')).getByRole('link');
    await expect(external).toHaveAccessibleName(/RISK-7 Sensor drift over long trips/);
    await page.locator(cell('link=same tab')).getByRole('link').focus();
    await page.keyboard.press('Tab');
    await expect(external).toBeFocused();
    await expect(card).toContainText('Sensor drift over long trips');
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
  });

  test('UIC-RECORD-CHIP-1.4 removes references from a field', async ({ page, lab }) => {
    await lab.open('record-chip');
    const field = page.locator('[data-lab-demo="references"]');
    await expect(field.locator('.ui-record-chip')).toHaveCount(3);
    await field.getByRole('button', { name: 'Remove TEST-48' }).click();
    await expect(field.locator('.ui-record-chip')).toHaveCount(2);
    await expect(field.getByRole('link', { name: /TEST-48/ })).toHaveCount(0);
  });

  test('UIC-RECORD-CHIP-1.5 shows only that a record is unavailable', async ({ page, lab }) => {
    await lab.open('record-chip');
    const missing = page.locator(cell('unavailable=missing layout=stacked'));
    await expect(missing).toHaveAttribute('data-layout', 'inline');
    await expect(missing).toHaveText('Missing item');
    await expect(missing.getByRole('button', { name: 'Remove Missing item' })).toBeVisible();
    await expect(missing.getByRole('link')).toHaveCount(0);
  });

  test('UIC-RECORD-CHIP-1.3 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('record-chip');
    await expect(page.locator('#lab-root .ui-record-chip').first()).toBeVisible();
    await lab.expectAccessible();
    await lab.open('record-chip', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
