import { expect, test } from './fixtures.js';

const cell = (id: string) => `[data-lab-cell="${id}"] .ui-record-label`;

test.describe('RecordLabel chip mode', () => {
  test('UIC-RECORD-LABEL-11.1 UIC-RECORD-LABEL-11.2 lays out the parts inline or stacked', async ({
    page,
    lab,
  }) => {
    await lab.open('record-label');
    const inline = page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator(cell('parts=details layout=inline'));
    await expect(inline).toHaveText('REQ-12 Brake pressure limits v3 Requirement Approved');
    const label = await inline.locator('.ui-record-label__label').boundingBox();
    const state = await inline.locator('.ui-record-label__state').boundingBox();
    expect(
      label && state && Math.abs(label.y + label.height / 2 - (state.y + state.height / 2)),
    ).toBeLessThan(4);

    const stacked = page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator(cell('parts=details layout=stacked'));
    await expect(stacked).toHaveAttribute('data-layout', 'stacked');
    const header = await stacked.locator('.ui-record-label__header').boundingBox();
    const name = await stacked.locator('.ui-record-label__name').boundingBox();
    expect(header && name && name.y >= header.y + header.height - 1).toBe(true);
    await expect(stacked.getByRole('link', { name: 'REQ-12' })).toHaveAccessibleDescription(
      'Brake pressure limits',
    );
  });

  test('UIC-RECORD-LABEL-11.3 previews a record on hover and on keyboard focus', async ({
    page,
    lab,
  }) => {
    await lab.open('record-label');
    const card = page.locator('.ui-record-label__preview');
    await page.mouse.move(5, 5);
    await page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator(cell('link=same tab'))
      .getByRole('link')
      .hover();
    await expect(card).toContainText('Risk, owned by Lena Ortiz');
    await page.mouse.move(5, 5);
    await expect(card).toHaveCount(0);

    const external = page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator(cell('link=new tab'))
      .getByRole('link');
    await expect(external).toHaveAccessibleName(/RISK-7 Sensor drift over long trips/);
    await page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator(cell('link=same tab'))
      .getByRole('link')
      .focus();
    await page.keyboard.press('Tab');
    await expect(external).toBeFocused();
    await expect(card).toContainText('Sensor drift over long trips');
    await page.keyboard.press('Escape');
    await expect(card).toHaveCount(0);
  });

  test('UIC-RECORD-LABEL-11.7 names and describes the link by the caller', async ({
    page,
    lab,
  }) => {
    await lab.open('record-label');
    const cases = page.locator('[data-lab-family="record-chip-cases"]');
    const stacked = cases
      .locator(cell('link=linked layout=stacked'))
      .getByRole('link', { name: 'TEST-48 Cold start at minus twenty, a test' });
    await expect(stacked).toHaveAccessibleDescription(
      'Opens the record in the side panel. Cold start at minus twenty',
    );
    await stacked.focus();
    await expect(page.locator('.ui-record-label__preview')).toContainText('owned by Jon Berg');
    await expect(stacked).toHaveAccessibleDescription(
      /^Opens the record in the side panel\. Cold start at minus twenty /,
    );
    const plain = cases.locator(cell('link=plain layout=inline'));
    await expect(plain.getByRole('link')).toHaveCount(0);
    await expect(plain.locator('.ui-record-label__accessible-label')).toHaveText(
      'TEST-48 Cold start at minus twenty, a test',
    );
  });

  test('UIC-RECORD-LABEL-11.4 removes references from a field', async ({ page, lab }) => {
    await lab.open('record-label');
    const field = page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator('[data-lab-demo="references"]');
    await expect(field.locator('.ui-record-label')).toHaveCount(3);
    await field.getByRole('button', { name: 'Remove TEST-48' }).click();
    await expect(field.locator('.ui-record-label')).toHaveCount(2);
    await expect(field.getByRole('link', { name: /TEST-48/ })).toHaveCount(0);
  });

  test('UIC-RECORD-LABEL-11.5 shows only that a record is unavailable', async ({ page, lab }) => {
    await lab.open('record-label');
    const missing = page
      .locator('[data-lab-family="record-chip-cases"]')
      .locator(cell('unavailable=missing layout=stacked'));
    await expect(missing).toHaveAttribute('data-layout', 'inline');
    await expect(missing).toHaveText('Missing item');
    await expect(missing.getByRole('button', { name: 'Remove Missing item' })).toBeVisible();
    await expect(missing.getByRole('link')).toHaveCount(0);
  });

  test('UIC-RECORD-LABEL-11.3 passes axe in both themes', async ({ page, lab }) => {
    await lab.open('record-label');
    await expect(
      page.locator('[data-lab-family="record-chip-cases"]').locator('.ui-record-label').first(),
    ).toBeVisible();
    await lab.expectAccessible();
    await lab.open('record-label', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
