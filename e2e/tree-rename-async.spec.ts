import { expect, test } from './fixtures.js';

test('UIC-TREE-7.3 preserves rejected inline names and retries them', async ({ page, lab }) => {
  await lab.open('tree');
  const tree = page.getByRole('treegrid', { name: 'Async rename tasks' });
  await tree.getByRole('row', { name: 'Draft' }).click();
  await page.keyboard.press('F2');
  const input = tree.getByRole('textbox', { name: 'Rename Draft' });
  await input.fill('reserved');
  await input.press('Enter');
  await expect(tree.getByText('Choose another name.')).toBeVisible();
  await expect(input).toBeFocused();
  await input.fill('Revised');
  await input.press('Enter');
  await expect(tree.getByRole('row', { name: 'Revised' })).toBeFocused();
});
