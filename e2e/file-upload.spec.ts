import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, variant: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} variant=${variant}"]`);
}

function upload(page: Page, variant: string): Locator {
  return page.locator(`[data-lab-upload="${variant}"]`);
}

test.describe('File Upload lab', () => {
  test('UIC-FILE-UPLOAD-1.1 UIC-FILE-UPLOAD-1.4 draws the button and the drop zone, enabled and disabled', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const button = cell(page, 'resting', 'button').getByRole('button', { name: 'Attach files' });
    await expect(button.locator('svg[data-glyph="upload"]')).toBeVisible();
    const zone = cell(page, 'described', 'dropzone').locator('.ui-file-upload__dropzone');
    await expect(zone.locator('.ui-file-upload__label')).toHaveText('Drop files here');
    await expect(zone.locator('.ui-file-upload__description')).toHaveText(
      '.pdf, image/* · Up to 5.0 MB',
    );
    await expect(zone).toHaveCSS('border-top-style', 'dashed');
    const disabled = cell(page, 'disabled', 'dropzone');
    await expect(disabled.getByRole('button', { name: 'Browse' })).toBeDisabled();
    await expect(disabled.locator('.ui-file-upload__dropzone')).toHaveAttribute(
      'data-disabled',
      'true',
    );
    await expect(cell(page, 'listed', 'button').locator('.ui-file-upload__file')).toHaveCount(4);
    await lab.expectAccessible();
  });

  test('UIC-FILE-UPLOAD-1.3 UIC-FILE-UPLOAD-3.1 UIC-FILE-UPLOAD-3.4 lists chosen files as the host uploads them', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'button');
    const chooser = target.locator('input[type="file"]');
    await chooser.setInputFiles([
      { name: 'Report.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048) },
      { name: 'fail-notes.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
    ]);
    const rows = target.locator('.ui-file-upload__file');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('.ui-file-upload__file-size')).toHaveText('2.0 KB');
    await expect(rows.nth(0)).toHaveAttribute('data-status', 'complete');
    await expect(rows.nth(1)).toHaveAttribute('data-status', 'error');
    await expect(rows.nth(1).getByRole('alert')).toHaveText('The upload was interrupted.');
    await target.getByRole('button', { name: 'Remove fail-notes.txt' }).click();
    await expect(rows).toHaveCount(1);
    await chooser.setInputFiles([
      { name: 'Report.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2048) },
    ]);
    await expect(rows).toHaveCount(2);
  });

  test('UIC-FILE-UPLOAD-2.3 UIC-FILE-UPLOAD-2.4 checks dropped files and marks the drop zone during a drag', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'dropzone');
    const zone = target.locator('.ui-file-upload__dropzone');
    // A drop from the system carries file entries; a scripted transfer has none, so give it some.
    await page.evaluate(() => {
      DataTransferItem.prototype.webkitGetAsEntry = function entry() {
        return { isFile: this.kind === 'file', isDirectory: false } as FileSystemEntry;
      };
    });
    const dataTransfer = await page.evaluateHandle(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File(['x'], 'Harbour.png', { type: 'image/png' }));
      transfer.items.add(new File(['y'], 'Notes.txt', { type: 'text/plain' }));
      return transfer;
    });
    await zone.dispatchEvent('dragenter', { dataTransfer });
    await expect(zone).toHaveAttribute('data-drop-target', 'true');
    await expect(zone).toHaveCSS('border-top-style', 'solid');
    await zone.dispatchEvent('drop', { dataTransfer });
    await expect(zone).not.toHaveAttribute('data-drop-target');
    await expect(target.locator('.ui-file-upload__file-name')).toHaveText(['Harbour.png']);
    await expect(target.locator('.ui-file-upload__rejections')).toHaveText(
      '1 file is not an accepted type.',
    );
    await expect(page.locator('[data-lab-output="dropzone-refused"]')).toHaveText(
      'Notes.txt (type)',
    );
  });

  test('UIC-FILE-UPLOAD-1.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('file-upload', { theme: 'dark' });
    await lab.expectAccessible();
  });
});
