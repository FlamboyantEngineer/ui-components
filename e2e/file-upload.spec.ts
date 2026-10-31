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

  test('UIC-FILE-UPLOAD-3.4 keeps keyboard focus in the upload as files are removed', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'button');
    await target.locator('input[type="file"]').setInputFiles([
      { name: 'first.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
      { name: 'second.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
    ]);
    const rows = target.locator('.ui-file-upload__file');
    await expect(rows).toHaveCount(2);
    await target.getByRole('button', { name: 'Remove first.txt' }).focus();
    await page.keyboard.press('Enter');
    await expect(rows).toHaveCount(1);
    await expect(target.getByRole('button', { name: 'Remove second.txt' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(rows).toHaveCount(0);
    await expect(target.getByRole('button', { name: 'Attach files' })).toBeFocused();
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

  test('UIC-FILE-UPLOAD-2.6 UIC-FILE-UPLOAD-2.7 UIC-FILE-UPLOAD-3.5 refuses duplicates and extra files and shows thumbnails', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'rules');
    const chooser = target.locator('input[type="file"]');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    await chooser.setInputFiles([
      { name: 'Harbour.png', mimeType: 'image/png', buffer: png },
      { name: 'Notes.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
    ]);
    const rows = target.locator('.ui-file-upload__file');
    await expect(rows).toHaveCount(2);
    const preview = rows.nth(0).locator('.ui-file-upload__file-preview');
    await expect(preview).toHaveAttribute('src', /^blob:/);
    await expect
      .poll(() => preview.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBe(1);
    await chooser.setInputFiles([
      { name: 'Notes.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
      { name: 'One.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
      { name: 'Two.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
      { name: 'Three.txt', mimeType: 'text/plain', buffer: Buffer.alloc(10) },
    ]);
    await expect(rows).toHaveCount(4);
    await expect(target.locator('.ui-file-upload__rejections')).toHaveText(
      '1 file is over the file limit. Notes.txt: A file with this name is already chosen.',
    );
    await expect(page.locator('[data-lab-output="rules-refused"]')).toHaveText(
      'Notes.txt (invalid), Three.txt (count)',
    );
  });

  test('UIC-FILE-UPLOAD-2.8 shows during a drag whether the drop zone would accept the files', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const zone = upload(page, 'dropzone').locator('.ui-file-upload__dropzone');
    // A drop from the system carries file entries; a scripted transfer has none, so give it some.
    await page.evaluate(() => {
      DataTransferItem.prototype.webkitGetAsEntry = function entry() {
        return { isFile: this.kind === 'file', isDirectory: false } as FileSystemEntry;
      };
    });
    const drag = (names: Array<[string, string]>) =>
      page.evaluateHandle((entries) => {
        const transfer = new DataTransfer();
        for (const [name, type] of entries) transfer.items.add(new File(['x'], name, { type }));
        return transfer;
      }, names);
    const images = await drag([['Harbour.png', 'image/png']]);
    await zone.dispatchEvent('dragenter', { dataTransfer: images });
    await expect(zone).toHaveAttribute('data-drop-accept', 'true');
    await expect(zone).not.toHaveAttribute('data-drop-reject');
    await expect(zone).toHaveCSS('border-top-color', 'rgb(26, 127, 55)');
    await zone.dispatchEvent('drop', { dataTransfer: images });
    await expect(zone).not.toHaveAttribute('data-drop-accept');
    const mixed = await drag([
      ['Harbour.png', 'image/png'],
      ['Notes.txt', 'text/plain'],
    ]);
    await zone.dispatchEvent('dragenter', { dataTransfer: mixed });
    await expect(zone).toHaveAttribute('data-drop-reject', 'true');
    await expect(zone).toHaveCSS('border-top-color', 'rgb(207, 34, 46)');
    await zone.dispatchEvent('drop', { dataTransfer: mixed });
    await expect(zone).not.toHaveAttribute('data-drop-reject');
    await expect(upload(page, 'dropzone').locator('.ui-file-upload__rejections')).toHaveText(
      '1 file is not an accepted type.',
    );
  });

  test('UIC-FILE-UPLOAD-1.5 reads a dropped folder through its subfolders', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'folder');
    await expect(target.locator('input[type="file"]')).toHaveAttribute('webkitdirectory', '');
    // A scripted drop carries no file system entries: give the folder placeholder some.
    await page.evaluate(() => {
      const fileEntry = (name: string) => ({
        isFile: true,
        isDirectory: false,
        name,
        file: (resolve: (file: File) => void) =>
          resolve(new File(['x'], name, { type: 'text/plain' })),
      });
      const folder = (name: string, children: unknown[]) => {
        let read = false;
        return {
          isFile: false,
          isDirectory: true,
          name,
          createReader: () => ({
            readEntries: (resolve: (entries: unknown[]) => void) => {
              resolve(read ? [] : children);
              read = true;
            },
          }),
        };
      };
      DataTransferItem.prototype.webkitGetAsEntry = function entry() {
        return folder('Recipes', [
          fileEntry('Soup.txt'),
          folder('Desserts', [fileEntry('Tart.txt')]),
        ]) as unknown as FileSystemEntry;
      };
    });
    const dataTransfer = await page.evaluateHandle(() => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([''], 'Recipes'));
      return transfer;
    });
    const zone = target.locator('.ui-file-upload__dropzone');
    await zone.dispatchEvent('dragenter', { dataTransfer });
    await zone.dispatchEvent('drop', { dataTransfer });
    await expect(target.locator('.ui-file-upload__file-name')).toHaveText(['Soup.txt', 'Tart.txt']);
  });

  test('UIC-FILE-UPLOAD-4.2 refuses an empty required upload in a form and submits the chosen files', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const form = page.locator('[data-lab-form="upload"]');
    await form.getByRole('button', { name: 'Send' }).click();
    const command = form.getByRole('button', { name: 'Attach the signed form' });
    await expect(command).toBeFocused();
    await expect(form.locator('.ui-file-upload__error')).toHaveText('A value is required.');
    await expect(command).toHaveAccessibleDescription('A value is required.');
    await expect(form.locator('.ui-file-upload')).toHaveAttribute('data-invalid', 'true');
    await expect(page.locator('[data-lab-output="form-sent"]')).toHaveText('nothing');
    await lab.expectAccessible();
    await form
      .locator('input[type="file"]:not([hidden])')
      .setInputFiles([
        { name: 'Signed.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(64) },
      ]);
    await expect(form.locator('.ui-file-upload__error')).toHaveCount(0);
    await form.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('[data-lab-output="form-sent"]')).toHaveText('Signed.pdf');
  });

  test('UIC-FILE-UPLOAD-1.1 passes axe in the dark theme', async ({ lab }) => {
    await lab.open('file-upload', { theme: 'dark' });
    await lab.expectAccessible();
  });

  test('UIC-FILE-UPLOAD-2.7 abandons a checked offer when the editor closes, and refuses a failed check', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('file-upload');
    const chooser = page.locator('[data-lab-upload="slow"] input[type="file"]');
    const listed = page.locator('[data-lab-output="slow-listed"]');
    const refused = page.locator('[data-lab-output="slow-refused"]');
    const sample = (name: string) => ({ name, mimeType: 'text/plain', buffer: Buffer.from('x') });
    await chooser.setInputFiles([sample('notes.txt')]);
    await page.getByRole('button', { name: 'Close the editor' }).click();
    await page.clock.runFor(2000);
    await page.getByRole('button', { name: 'Open the editor' }).click();
    await expect(listed).toHaveText('0');
    await expect(refused).toHaveText('none');

    await chooser.setInputFiles([sample('offline.txt'), sample('plan.txt')]);
    await page.clock.runFor(3100);
    await expect(listed).toHaveText('1');
    await expect(refused).toHaveText('offline.txt (unchecked)');
    await expect(page.locator('[data-lab-upload="slow"] [role="alert"]')).toHaveText(
      '1 file could not be checked.',
    );

    await chooser.setInputFiles([sample('broken.txt'), sample('offline.txt'), sample('notes.txt')]);
    await page.clock.runFor(3100);
    await expect(listed).toHaveText('2');
    await expect(refused).toHaveText('broken.txt (unchecked), offline.txt (unchecked)');
    await expect(page.locator('[data-lab-upload="slow"] [role="alert"]')).toHaveText(
      '2 files could not be checked.',
    );
  });
});
