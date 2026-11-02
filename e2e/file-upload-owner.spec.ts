import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);

test.describe('File Upload lab read-only files, first-file policy and owner command', () => {
  test('UIC-FILE-UPLOAD-3.1 keeps previews and actions while read-only', async ({ page, lab }) => {
    await lab.open('file-upload');
    const demo = page.locator('[data-lab-demo="read-only-files"]');
    await expect(demo.getByText('Shared with the review group for 30 days.')).toBeVisible();
    await expect(demo.locator('[data-lab-preview]')).toHaveText(['TXT', 'PDF']);
    await expect(demo.getByRole('button', { name: 'Shared files' })).toBeVisible();
    await expect(demo.getByRole('button', { name: 'Remove Brief.pdf' })).toBeVisible();
    await demo.getByRole('button', { name: 'Make the files read-only' }).click();
    await expect(demo.getByRole('button', { name: 'Shared files' })).toHaveCount(0);
    await expect(demo.getByRole('button', { name: /^Remove/ })).toHaveCount(0);
    await expect(demo.locator('[data-lab-preview]')).toHaveText(['TXT', 'PDF']);
    await demo.getByRole('button', { name: 'Open Minutes.txt' }).click();
    await expect(output(page, 'shared-opened')).toHaveText('Minutes.txt');
    await demo.getByRole('button', { name: 'Make the files editable' }).click();
    await expect(demo.getByRole('button', { name: 'Remove Brief.pdf' })).toBeVisible();
  });

  test('UIC-FILE-UPLOAD-2.6 keeps the first of several dropped files', async ({ page, lab }) => {
    await lab.open('file-upload');
    await page.evaluate(() => {
      DataTransferItem.prototype.webkitGetAsEntry = function entry() {
        return { isFile: this.kind === 'file', isDirectory: false } as FileSystemEntry;
      };
    });
    const target = page.locator('[data-lab-upload="single-first"]');
    const zone = target.locator('.ui-file-upload__dropzone');
    const dataTransfer = await page.evaluateHandle(() => {
      const transfer = new DataTransfer();
      for (const name of ['First.pdf', 'Second.pdf']) {
        transfer.items.add(new File(['x'], name, { type: 'application/pdf' }));
      }
      return transfer;
    });
    await zone.dispatchEvent('dragenter', { dataTransfer });
    await zone.dispatchEvent('drop', { dataTransfer });
    await expect(target.locator('.ui-file-upload__file-name')).toHaveText(['First.pdf']);
    await expect(output(page, 'single-first-refused')).toHaveText('none');
    await expect(target.getByRole('alert')).toHaveCount(0);
    await dataTransfer.dispose();
  });

  test('UIC-FILE-UPLOAD-1.1 names and focuses the chooser for its owner', async ({ page, lab }) => {
    await lab.open('file-upload');
    const demo = page.locator('[data-lab-demo="owned-command"]');
    const command = demo.getByRole('button', { name: /Supporting documents/ });
    await expect(command).toHaveAttribute('id', 'supporting-documents');
    await demo.getByRole('button', { name: 'Focus the chooser' }).click();
    await expect(command).toBeFocused();
  });
});
