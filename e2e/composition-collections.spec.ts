import { readFileSync } from 'node:fs';
import { expectCompositionGeometry } from './composition-geometry.js';
import { expect, test } from './fixtures.js';

const section = (page: Parameters<typeof expectCompositionGeometry>[0], name: string) =>
  page.locator(`[data-lab-section="${name}"]`);

test('UIC-COMPOSITION-6.1 keeps collection recipes copyable with shared reference styling', async ({
  page,
  lab,
}) => {
  for (const name of ['feeds', 'options', 'views', 'editors']) {
    const source = readFileSync(`labs/src/composition-collections-${name}.tsx`, 'utf8');
    expect(source).not.toMatch(/\b(?:style|className)\s*=/);
    expect(source).not.toMatch(/import\s+['"][^'"]+\.css/);
  }
  await lab.open('composition-collections');
  await expect(page.locator('#ui-lab-stylesheet')).toHaveAttribute('href', /reference\.css/);
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expectCompositionGeometry(page, 12);
    const gap = await section(page, 'Related constraints')
      .locator('.ui-grid')
      .evaluate((element) => getComputedStyle(element).gap);
    expect(gap).toBe('8px');
  }
});

test('UIC-COMPOSITION-6.2 preserves collection dismissal and permission policy', async ({
  page,
  lab,
}) => {
  await lab.open('composition-collections');
  const updates = section(page, 'Dismissible updates');
  await updates.getByRole('button', { name: 'Dismiss Review ready' }).click();
  await expect(updates.getByText('Review ready', { exact: true })).toHaveCount(0);
  await updates.getByRole('button', { name: 'Dismiss Export finished' }).click();
  await expect(updates.getByText('No updates')).toBeVisible();
  const rights = section(page, 'Permission choices');
  const all = rights.getByRole('checkbox', { name: 'All editable permissions' });
  await all.focus();
  await all.press('Space');
  await expect(rights.getByRole('checkbox', { name: 'Reviewers can write' })).toBeChecked();
  const inherited = rights.getByRole('checkbox', { name: 'Guests can read (inherited)' });
  await expect(inherited).toBeChecked();
  await inherited.focus();
  await inherited.press('Space');
  await expect(inherited).toBeChecked();
});

test('UIC-COMPOSITION-6.2 creates host collections and keeps failed asynchronous rename drafts', async ({
  page,
  lab,
}) => {
  await lab.open('composition-collections');
  const collections = section(page, 'Collection management');
  await collections.getByRole('button', { name: 'Create collection' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create collection' });
  const name = dialog.getByRole('textbox', { name: 'Collection name' });
  await name.fill('Archive');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(dialog.getByText('That name is already used.')).toBeVisible();
  await expect(name).toHaveValue('Archive');
  await name.fill('Research');
  await dialog.getByRole('button', { name: 'Create', exact: true }).click();
  const row = collections.getByRole('row', { name: 'Research', exact: true });
  await expect(row).toBeVisible();
  await expect(collections.getByRole('button', { name: 'Create collection' })).toBeFocused();
  await row.click();
  await row.press('F2');
  const rename = collections.getByRole('textbox', { name: /Rename/ });
  await rename.fill('Archive');
  await rename.press('Enter');
  await expect(collections.getByText('That name is already used.')).toBeVisible();
  await expect(rename).toHaveValue('Archive');
  await rename.fill('Notes');
  await rename.press('Enter');
  await expect(collections.getByRole('row', { name: 'Notes', exact: true })).toBeVisible();
});
