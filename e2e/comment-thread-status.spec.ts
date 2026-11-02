import { expect, test } from './fixtures.js';

const thread = (chip: string, mode: string) => `[data-lab-thread="status-${chip}-${mode}"]`;

test.describe('Comment Thread state chips', () => {
  test('UIC-COMMENT-THREAD-1.11 shows an icon-only Resolved chip named by its tooltip, apart from the actions', async ({
    page,
    lab,
  }) => {
    await lab.open('comment-thread');
    const icon = page.locator(thread('icon', 'interactive'));
    const chip = icon.getByRole('img', { name: 'Resolved' });
    await expect(chip).toBeVisible();
    const box = await chip.boundingBox();
    expect(box && Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
    await chip.focus();
    await expect(page.getByRole('tooltip')).toHaveText('Resolved');
    await icon.getByRole('button', { name: 'Reopen' }).click();
    await expect(chip).toHaveCount(0);
    await icon.getByRole('button', { name: 'Resolve' }).click();
    await expect(chip).toBeVisible();

    const text = page.locator(thread('text', 'interactive'));
    await expect(text.locator('.ui-comment-thread__status')).toHaveText('Resolved');

    const readOnly = page.locator(thread('icon', 'read-only'));
    await expect(readOnly.getByRole('img', { name: 'Resolved' })).toBeVisible();
    await expect(readOnly.getByRole('button', { name: /Resolve|Reopen/ })).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-COMMENT-THREAD-1.11 keeps the icon chip whole right to left', async ({ page, lab }) => {
    await lab.open('comment-thread');
    const icon = page.locator(thread('icon', 'interactive'));
    await icon.evaluate((element) => element.setAttribute('dir', 'rtl'));
    const chip = icon.getByRole('img', { name: 'Resolved' });
    const glyph = chip.locator('.ui-badge__start-icon');
    const [chipBox, glyphBox] = [await chip.boundingBox(), await glyph.boundingBox()];
    if (!chipBox || !glyphBox) throw new Error('The chip has no box.');
    // The glyph sits centred in its chip.
    const offset = glyphBox.x + glyphBox.width / 2 - (chipBox.x + chipBox.width / 2);
    expect(Math.abs(offset)).toBeLessThanOrEqual(1);
  });
});
