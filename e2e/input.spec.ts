import { expect, test } from './fixtures.js';

test('UIC-INPUT-1.1 edits a native input and exposes its state', async ({ lab, page }) => {
  await lab.open('input');
  const input = page.getByRole('textbox', { name: 'Reference (default)' });
  await input.fill('AB-42');
  await expect(input).toHaveValue('AB-42');
  await expect(input).toHaveAttribute('data-focused', 'true');
  await expect(page.getByRole('textbox', { name: 'Reference (disabled)' })).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Reference (read-only)' })).not.toBeEditable();
  await expect(page.getByRole('textbox', { name: 'Reference (invalid)' })).toHaveAttribute(
    'data-invalid',
    'true',
  );
});
