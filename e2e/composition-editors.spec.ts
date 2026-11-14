import { readFileSync } from 'node:fs';
import { expectCompositionGeometry } from './composition-geometry.js';
import { expect, test } from './fixtures.js';

const section = (page: Parameters<typeof expectCompositionGeometry>[0], name: string) =>
  page.locator(`[data-lab-section="${name}"]`);

test('UIC-COMPOSITION-6.3 keeps editor recipes usable with reference styling at compact and wide widths', async ({
  page,
  lab,
}) => {
  for (const name of ['composition-editors', 'composition-editors-grid']) {
    const source = readFileSync(`labs/src/${name}.tsx`, 'utf8');
    expect(source).not.toMatch(/\b(?:style|className)\s*=/);
    expect(source).not.toMatch(/import\s+['"][^'"]+\.css/);
  }
  await lab.open('composition-editors');
  await expect(page.locator('#ui-lab-stylesheet')).toHaveAttribute('href', /reference\.css/);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expectCompositionGeometry(page, 6);
  }
});

test('UIC-COMPOSITION-6.4 validates and saves a host event draft in a compact modal', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await lab.open('composition-editors');
  await section(page, 'Event drafts')
    .getByRole('button', { name: /^Review,/ })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Edit event' });
  const title = dialog.getByRole('textbox', { name: 'Title', exact: true });
  await title.fill('');
  await expect(dialog.getByRole('button', { name: 'Save', exact: true })).toBeDisabled();
  await title.fill('Planning');
  const geometry = await dialog.evaluate((element) => ({
    width: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.width + 1);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    section(page, 'Event drafts').getByRole('button', { name: /^Planning,/ }),
  ).toBeVisible();
});

test('UIC-COMPOSITION-6.4 preserves selected-row scope and raw source cancellation', async ({
  page,
  lab,
}) => {
  await lab.open('composition-editors');
  const table = section(page, 'Selected row actions');
  const selected = table.getByRole('row', { name: 'Maple', exact: true }).getByRole('checkbox');
  await selected.focus();
  await selected.press('Space');
  await table.getByRole('textbox', { name: 'Group for selected rows' }).fill('Woodland');
  await table.getByRole('button', { name: 'Set group', exact: true }).click();
  await table.getByRole('button', { name: 'Export selected rows' }).click();
  await expect(table.getByLabel('CSV preview')).toContainText('Maple,Woodland');
  await expect(table.getByLabel('CSV preview')).not.toContainText('Mint');
  const formula = section(page, 'Raw source editing');
  const raw = formula.getByRole('textbox', { name: 'Raw cell content' });
  await raw.fill('=2+2');
  await formula.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(formula.getByText('A1: =2+2', { exact: true })).toBeVisible();
  await raw.fill('=3+3');
  await raw.press('Escape');
  await expect(raw).toHaveValue('=2+2');
});

test('UIC-COMPOSITION-6.4 composes asynchronous asset selection with proportional placement', async ({
  page,
  lab,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await lab.open('composition-editors');
  const placement = section(page, 'Asset placement');
  await placement.getByRole('row', { name: 'Sample image', exact: true }).click();
  await placement.getByRole('button', { name: 'Insert', exact: true }).click();
  await placement.getByRole('textbox', { name: 'Alternative text' }).fill('A sample');
  await placement.getByRole('textbox', { name: 'Width', exact: true }).fill('400');
  await placement.getByRole('textbox', { name: 'Width', exact: true }).press('Tab');
  await expect(placement.getByRole('textbox', { name: 'Height', exact: true })).toHaveValue('300');
  await placement.getByRole('button', { name: 'Place image' }).click();
  await expect(
    placement.getByText('Sample image: A sample, 400 pixels, start', { exact: true }),
  ).toBeVisible();
  await expectCompositionGeometry(page, 6);
});
