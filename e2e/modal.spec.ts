import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const sizes = [
  ['sm', 400],
  ['md', 560],
  ['lg', 800],
  ['xl', 1120],
] as const;

/** The `data-lab-*` marker of the element topmost at the centre of `target`. */
async function topmostAt(page: Page, target: Locator, attribute: string) {
  const box = await target.boundingBox();
  if (!box) throw new Error('target not rendered');
  return page.evaluate(
    ([x, y, name]) =>
      document
        .elementFromPoint(x as number, y as number)
        ?.closest(`[${name as string}]`)
        ?.getAttribute(name as string) ?? null,
    [box.x + box.width / 2, box.y + box.height / 2, attribute] as const,
  );
}

test.describe('Modal lab', () => {
  test('UIC-MODAL-1.1 UIC-MODAL-1.4 UIC-MODAL-3.3 opens every variant and size and returns focus to its button', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const viewport = page.viewportSize();
    for (const variant of ['default', 'danger']) {
      for (const [size, width] of [...sizes, ['full', (viewport?.width ?? 0) - 32] as const]) {
        const button = page.locator(`[data-lab-cell="variant=${variant} size=${size}"] button`);
        await button.click();
        const overlay = page.locator(`.ui-modal[data-lab-modal="${variant}-${size}"]`);
        await expect(overlay).toHaveAttribute('data-variant', variant);
        await expect(overlay).toHaveAttribute('data-size', size);
        const dialog = page.getByRole('dialog');
        await expect(dialog).toHaveAccessibleName(
          `${variant === 'danger' ? 'Delete' : 'Rename'} Report.pdf`,
        );
        const panel = await overlay.locator('.ui-modal__panel').boundingBox();
        expect(panel?.width).toBeCloseTo(width, 0);
        await page.keyboard.press('Escape');
        await expect(dialog).toHaveCount(0);
        await expect(button).toBeFocused();
      }
    }
    await lab.expectAccessible();
  });

  test('UIC-MODAL-3.1 UIC-MODAL-3.2 UIC-MODAL-5.2 UIC-MODAL-6.1 saves with Control+Enter once and closes', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const opener = page.locator('[data-lab-open="save"]');
    await opener.click();
    const city = page.getByRole('textbox', { name: 'City' });
    await expect(city).toBeFocused();
    await page.keyboard.press('ControlOrMeta+Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await city.fill('Lisbon');
    const save = page.getByRole('button', { name: 'Save' });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(save).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(city).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(save).toBeFocused();
    await city.focus();
    await page.keyboard.press('Control+Enter');
    await expect(save).toHaveAttribute('data-pending', 'true');
    await page.keyboard.press('Control+Enter');
    await save.click({ force: true });
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 3000 });
    await expect(page.locator('[data-lab-output="saved"]')).toHaveText('Lisbon');
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-5.3 keeps a failed save open with the error', async ({ page, lab }) => {
    await lab.open('modal');
    await page.getByRole('checkbox', { name: 'Make the save fail' }).check();
    await page.locator('[data-lab-open="save"]').click();
    await page.getByRole('textbox', { name: 'City' }).fill('Kyoto');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert')).toHaveText('The list is full.', { timeout: 3000 });
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).not.toHaveAttribute('data-pending');
    await lab.expectAccessible('.ui-modal');
  });

  test('UIC-MODAL-1.2 UIC-MODAL-1.3 UIC-MODAL-2.1 UIC-MODAL-2.2 stacks modals below the toast layer', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    const opener = page.locator('[data-lab-open="stack"]');
    await opener.click();
    const outer = page.locator('.ui-modal[data-lab-modal="outer"]');
    await expect(outer).toHaveCSS('z-index', '120');
    await expect(outer).toHaveCSS('position', 'fixed');
    expect(await topmostAt(page, opener, 'data-lab-modal')).toBe('outer');

    await page.getByRole('button', { name: 'Show notice' }).click();
    const notice = page.locator('[data-lab-notice] [role="status"]');
    await expect(notice).toBeVisible();
    await page.getByRole('button', { name: 'Edit dates' }).click();
    const inner = page.locator('.ui-modal[data-lab-modal="inner"]');
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toBeVisible();
    await expect(inner).toHaveCSS('z-index', '120');
    expect(await topmostAt(page, page.locator('.ui-modal__panel').last(), 'data-lab-modal')).toBe(
      'inner',
    );
    expect(await topmostAt(page, notice, 'data-lab-notice')).toBe('');
    const followsOuter = await page.evaluate(() => {
      const [first, second] = document.querySelectorAll('body > .ui-modal');
      return Boolean(first && second && first.compareDocumentPosition(second) & 4);
    });
    expect(followsOuter).toBe(true);

    const panel = await inner.locator('.ui-modal__panel').boundingBox();
    if (!panel) throw new Error('panel not rendered');
    await page.mouse.move(panel.x + 20, panel.y + 20);
    await page.mouse.down();
    await page.mouse.move(8, 8);
    await page.mouse.up();
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Trip to Oslo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit dates' })).toBeFocused();

    await page.getByRole('button', { name: 'Edit dates' }).click();
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Edit dates' })).toHaveCount(0);
    await page.mouse.click(8, 8);
    await expect(page.getByRole('dialog', { name: 'Trip to Oslo' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(outer).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-MODAL-4.1 UIC-MODAL-6.1 describes the dialog and leaves Control+Enter to a text area', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    await page.getByRole('button', { name: 'Write a note' }).click();
    const dialog = page.getByRole('dialog', { name: 'Note' });
    await expect(dialog).toHaveAccessibleDescription('Notes stay on this device.');
    await expect(dialog.getByRole('heading', { level: 2 })).toHaveText('Note');
    await expect(dialog.locator('.ui-modal__header-actions')).toHaveText('Step 1 of 2');
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeFocused();
    const text = page.getByRole('textbox', { name: 'Text' });
    await text.focus();
    await page.keyboard.type('Line one');
    await page.keyboard.press('Control+Enter');
    await expect(dialog).toBeVisible();
    await page.getByRole('textbox', { name: 'Title' }).focus();
    await page.keyboard.press('Control+Enter');
    await expect(dialog).toHaveCount(0);
  });

  test('UIC-MODAL-5.1 shows footer states and passes an accessibility check', async ({
    page,
    lab,
  }) => {
    await lab.open('modal');
    await page.locator('[data-lab-cell="state=error variant=danger"] button').click();
    await expect(page.getByRole('alert')).toHaveText('Lisbon is not available.');
    const buttons = page.locator('.ui-modal__actions button');
    await expect(buttons).toHaveText(['Cancel', 'Apply']);
    await expect(buttons.last()).toHaveAttribute('data-variant', 'danger');
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('Escape');

    await page.locator('[data-lab-cell="state=secondary action variant=default"] button').click();
    await expect(buttons).toHaveText(['Cancel', 'Discard', 'Save']);
    await page.getByRole('button', { name: 'Discard' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('UIC-MODAL-1.1 works without a stylesheet', async ({ page, lab }) => {
    await lab.open('modal', { stylesheet: 'none' });
    const button = page.locator('[data-lab-cell="variant=default size=md"] button');
    await button.click();
    await expect(page.getByRole('dialog', { name: 'Rename Report.pdf' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toBeFocused();
  });

  test('UIC-MODAL-1.4 UIC-MODAL-5.5 passes an accessibility check in the dark theme', async ({
    page,
    lab,
  }) => {
    await lab.open('modal', { theme: 'dark' });
    await lab.expectAccessible();
    await page.locator('[data-lab-cell="state=error variant=danger"] button').click();
    await expect(page.getByRole('alert')).toHaveText('Lisbon is not available.');
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('Escape');
    await page.locator('[data-lab-cell="state=status variant=default"] button').click();
    await expect(page.locator('.ui-modal').getByRole('status')).toHaveText('Choose a city.');
    await lab.expectAccessible('.ui-modal');
  });
});
