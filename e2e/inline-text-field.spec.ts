import { expect, test } from './fixtures.js';

test.describe('Inline Text Field lab', () => {
  test('UIC-INLINE-TEXT-FIELD-1.1 shows each state without taking focus', async ({ page, lab }) => {
    await lab.open('inline-text-field');
    const empty = page.getByRole('textbox', { name: 'Caption empty editable' });
    await expect(empty).toHaveAttribute('placeholder', 'Add a caption');
    await expect(empty).not.toBeFocused();
    await expect(page.getByRole('textbox', { name: 'Caption filled read only' })).toHaveAttribute(
      'readonly',
      '',
    );
    await lab.expectAccessible('[data-lab-demo="document"]');
  });

  test('UIC-INLINE-TEXT-FIELD-1.2 UIC-INLINE-TEXT-FIELD-1.3 UIC-INLINE-TEXT-FIELD-1.5 edits a caption inside an editable document', async ({
    page,
    lab,
  }) => {
    await lab.open('inline-text-field');
    const demo = page.locator('[data-lab-demo="document"]');
    const caption = demo.getByRole('textbox', { name: 'Caption' });
    await caption.click();
    await page.keyboard.press('ControlOrMeta+a');
    expect(
      await caption.evaluate((input: HTMLInputElement) => [
        input.selectionStart,
        input.selectionEnd,
      ]),
    ).toEqual([0, 17]);
    await page.keyboard.type('Ripe pears');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="caption"]')).toHaveText('Committed: Ripe pear');
    await page.keyboard.type('s and plums');
    await page.keyboard.press('Escape');
    await expect(caption).toHaveValue('Ripe pear');
    await expect(demo.locator('[data-lab-output="host"]')).toHaveText('Document received: nothing');
    await page.keyboard.press('Tab');
    await expect(demo.locator('[data-lab-output="host"]')).toHaveText(
      'Document received: keydown Tab',
    );
  });
});
