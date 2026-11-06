import { expect, test } from './fixtures.js';

test.describe('Combobox change reasons', () => {
  test('UIC-COMBOBOX-6.1 UIC-COMBOBOX-6.2 reports why each callback ran', async ({ page, lab }) => {
    await lab.open('combobox');
    const section = page.locator('[data-lab-section="Change reasons"]');
    const single = section.getByRole('combobox', { name: 'Herb, with reasons' });
    const singleLog = section.locator('[data-lab-output="Single reasons"]');
    await single.fill('mi');
    await expect(singleLog).toContainText('text “mi” (input)');
    await section.page().getByRole('option', { name: 'Mint' }).click();
    await expect(singleLog).toContainText(
      'change "mint" (select) · close (select) · text “Mint” (sync)',
    );
    await single.press('Escape');
    await section.getByRole('button', { name: 'Clear' }).first().click();
    await expect(singleLog).toContainText('change null (clear) · text “” (clear)');
    // The emptied text opens the list, which hides the rest of the page until it closes.
    await single.press('Escape');

    const several = section.getByRole('combobox', { name: 'Herbs, with reasons' });
    const severalLog = section.locator('[data-lab-output="Multiple reasons"]');
    await several.focus();
    await page.keyboard.press('ArrowDown');
    await expect(severalLog).toContainText('open (manual)');
    await page.keyboard.press('Escape');
    await expect(severalLog).toContainText('close (dismiss)');
    await section.getByRole('button', { name: /Remove.*Mint/ }).click();
    await expect(severalLog).toContainText('change [] (remove)');
    await lab.expectAccessible();
  });
});
