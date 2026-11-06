import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

function fileNames(demo: Locator) {
  return demo.locator('.ui-file-upload__file-name').allTextContents();
}

test.describe('File Upload lab reordering', () => {
  test('UIC-FILE-UPLOAD-3.10 drags a file by its handle onto another file', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const demo = page.locator('[data-lab-demo="reorder-documents"]');
    await demo.locator('.ui-file-upload__files').scrollIntoViewIfNeeded();
    const handle = await demo
      .getByRole('button', { name: 'Move Agenda.txt', exact: true })
      .boundingBox();
    const target = await demo.getByRole('listitem').filter({ hasText: 'Budget.txt' }).boundingBox();
    if (!handle || !target) throw new Error('The handle and the target file must be on screen.');
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + 20, handle.y + 20, { steps: 5 });
    await page.mouse.move(target.x + 100, target.y + target.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(output(page, 'reorder-order')).toHaveText('1, budget, 1, notes');
    await expect(demo.locator('.ui-file-upload > [role="status"]')).toHaveText(
      'Agenda.txt moved to position 3 of 4',
    );
    await expect(demo.locator('[data-dragging], [data-drop-position]')).toHaveCount(0);
    // Each file keeps its own state: the text id "1" is still uploading, the numeric 1 is not.
    await expect(demo.getByRole('listitem').nth(0)).toHaveAttribute('data-status', 'uploading');
    await expect(demo.getByRole('listitem').nth(1)).toHaveAttribute('data-status', 'error');
    await demo.getByRole('button', { name: 'Send' }).click();
    await expect(output(page, 'reorder-sent')).toHaveText(
      'Minutes.txt, Budget.txt, Agenda.txt, Notes.txt',
    );
  });

  test('UIC-FILE-UPLOAD-3.10 drags a file by keyboard from its handle to the same place', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const demo = page.locator('[data-lab-demo="reorder-documents"]');
    await demo.getByRole('button', { name: 'Move Agenda.txt', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('.ui-file-upload__file[data-drop-position]')).toHaveCount(1);
    await expect(demo.locator('.ui-file-upload__file[data-drop-position]')).toContainText(
      'Minutes.txt',
    );
    await page.keyboard.press('Tab');
    await expect(demo.locator('.ui-file-upload__file[data-drop-position]')).toContainText(
      'Budget.txt',
    );
    await page.keyboard.press('Enter');
    await expect(output(page, 'reorder-order')).toHaveText('1, budget, 1, notes');
    await expect(demo.locator('.ui-file-upload > [role="status"]')).toHaveText(
      'Agenda.txt moved to position 3 of 4',
    );
  });

  test('UIC-FILE-UPLOAD-3.10 moves a file by Alt+Arrow keys, keeping focus, and refuses while disabled', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const demo = page.locator('[data-lab-demo="reorder-images"]');
    const handle = demo.getByRole('button', { name: 'Move Harbour.svg', exact: true });
    await handle.focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => fileNames(demo)).toEqual(['Forest.svg', 'Harbour.svg', 'Sunset.svg']);
    await expect(handle).toBeFocused();
    await page.keyboard.press('Alt+ArrowDown');
    await expect.poll(() => fileNames(demo)).toEqual(['Forest.svg', 'Sunset.svg', 'Harbour.svg']);
    await expect(handle).toBeFocused();
    await expect(demo.locator('.ui-file-upload > [role="status"]')).toHaveText(
      'Harbour.svg moved to position 3 of 3',
    );

    const documents = page.locator('[data-lab-demo="reorder-documents"]');
    await documents.getByRole('checkbox', { name: 'Disabled' }).check();
    await expect(
      documents.getByRole('button', { name: 'Move Agenda.txt', exact: true }),
    ).toBeDisabled();
    await documents.getByRole('listitem').first().click();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(output(page, 'reorder-order')).toHaveText('1, 1, budget, notes');
  });

  test('UIC-FILE-UPLOAD-3.10 passes axe with reorderable lists', async ({ page, lab }) => {
    await lab.open('file-upload');
    await lab.expectAccessible('[data-lab-demo="reorder-documents"]');
    await lab.expectAccessible('[data-lab-demo="reorder-images"]');
    await expect(page.getByRole('button', { name: 'Move Sunset.svg', exact: true })).toBeVisible();
  });
});
