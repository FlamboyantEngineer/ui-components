import type { Locator, Page } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

function cell(page: Page, state: string, variant: string): Locator {
  return matrixCell(page, `state=${state} variant=${variant}`);
}

function upload(page: Page, variant: string): Locator {
  return page.locator(`[data-lab-upload="${variant}"]`);
}

test.describe('File Upload lab', () => {
  test('UIC-FILE-UPLOAD-1.5 shows a folder read failure and notifies the host', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'folder');
    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(new File(['x'], 'Documents'));
      DataTransferItem.prototype.webkitGetAsEntry = () =>
        ({
          isDirectory: true,
          name: 'Documents',
          createReader: () => ({
            readEntries: (_success: unknown, fail: (error: Error) => void) =>
              fail(new Error('Folder access was refused.')),
          }),
        }) as unknown as FileSystemEntry;
      return data;
    });
    await target
      .locator('.ui-file-upload__dropzone')
      .dispatchEvent('drop', { dataTransfer: transfer });
    await expect(target.getByRole('alert')).toHaveText('Folder access was refused.');
    await expect(page.locator('[data-lab-output="folder-error"]')).toHaveText(
      'Folder access was refused.',
    );
    const readable = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(new File(['notes'], 'Notes.txt', { type: 'text/plain' }));
      DataTransferItem.prototype.webkitGetAsEntry = () =>
        ({ isFile: true, isDirectory: false }) as FileSystemEntry;
      return data;
    });
    await target
      .locator('.ui-file-upload__dropzone')
      .dispatchEvent('drop', { dataTransfer: readable });
    await expect(target.getByRole('alert')).toBeHidden();
    await expect(target.locator('.ui-file-upload__file-name')).toHaveText('Notes.txt');
  });
  test('UIC-FILE-UPLOAD-2.6 UIC-FILE-UPLOAD-2.8 rejects whole single-file offers and permits replacement', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const target = upload(page, 'single');
    const chooser = target.locator('input[type="file"]');
    await expect(chooser).not.toHaveAttribute('multiple');
    await expect(chooser).toHaveAttribute('accept', '.pdf');
    await page.evaluate(() => {
      DataTransferItem.prototype.webkitGetAsEntry = function entry() {
        return { isFile: this.kind === 'file', isDirectory: false } as FileSystemEntry;
      };
    });
    const zone = target.locator('.ui-file-upload__dropzone');
    const sample = (name: string) => ({
      name,
      mimeType: 'application/pdf',
      buffer: Buffer.from('x'),
    });
    for (const selected of [false, true]) {
      if (selected) await chooser.setInputFiles(sample('Current.pdf'));
      const dataTransfer = await page.evaluateHandle(() => {
        const transfer = new DataTransfer();
        for (const name of ['First.pdf', 'Second.pdf']) {
          transfer.items.add(new File(['x'], name, { type: 'application/pdf' }));
        }
        return transfer;
      });
      await zone.dispatchEvent('dragenter', { dataTransfer });
      await expect(zone).toHaveAttribute('data-drop-reject', 'true');
      await zone.dispatchEvent('drop', { dataTransfer });
      await expect(target.getByRole('alert')).toHaveText('2 files are over the file limit.');
      await expect(page.locator('[data-lab-output="single-refused"]')).toHaveText(
        'First.pdf (count), Second.pdf (count)',
      );
      await expect(target.locator('.ui-file-upload__file-name')).toHaveText(
        selected ? ['Current.pdf'] : [],
      );
      await chooser.setInputFiles(sample('Accepted.pdf'));
      await expect(target.locator('.ui-file-upload__file-name')).toHaveText(['Accepted.pdf']);
      await expect(target.getByRole('alert')).toHaveCount(0);
      await expect(page.locator('[data-lab-output="single-refused"]')).toHaveText('none');
      await dataTransfer.dispose();
    }
    await lab.expectAccessible();
  });
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

  test('UIC-FILE-UPLOAD-3.5 UIC-FILE-UPLOAD-3.7 loads thumbnails lazily and shows the glyph for one it cannot decode', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const box = page.locator('[data-lab-demo="many-photos"]');
    const rows = box.locator('.ui-file-upload__file');
    await expect(rows).toHaveCount(40);
    await box.scrollIntoViewIfNeeded();
    const broken = rows.filter({ hasText: 'Photo 3.heic' });
    await expect(broken.locator('.ui-file-upload__file-preview')).toHaveCount(0);
    await expect(broken.locator('.ui-file-upload__file-icon')).toHaveAttribute(
      'data-glyph',
      'file-image',
    );
    const first = rows.nth(0).locator('.ui-file-upload__file-preview');
    await expect
      .poll(() => first.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBe(32);
    const last = rows.nth(39).locator('.ui-file-upload__file-preview');
    await expect(last).toHaveAttribute('loading', 'lazy');
    await expect(last).toHaveAttribute('decoding', 'async');
    await last.scrollIntoViewIfNeeded();
    await expect
      .poll(() => last.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBe(32);
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

  for (const fallback of [false, true]) {
    for (const shadow of ['upload-name', 'control-name', 'control-id'] as const) {
      test(`UIC-FILE-UPLOAD-4.2 repairs files when ${shadow} shadows form.elements ${fallback ? 'without' : 'with'} DataTransfer`, async ({
        page,
        lab,
      }) => {
        if (fallback) {
          await page.addInitScript(() => {
            Object.defineProperty(window, 'DataTransfer', { value: undefined, configurable: true });
          });
        }
        await lab.open('file-upload');
        const form = page.locator('[data-lab-form="shared-uploads"]');
        for (const [variant, name, text] of [
          ['shared-first', 'a.txt', 'first'],
          ['shared-second', 'b.txt', 'second'],
        ] as const) {
          await upload(page, variant)
            .locator('input[type="file"]:not([hidden])')
            .setInputFiles({
              name,
              mimeType: 'text/plain',
              buffer: Buffer.from(text),
            });
        }
        await expect(form.locator('.ui-file-upload__file-name')).toHaveText(['a.txt', 'b.txt']);
        const result = await form.evaluate(async (element: HTMLFormElement, kind) => {
          const first = element.querySelector<HTMLInputElement>(
            '[data-lab-upload="shared-first"] input[hidden]',
          );
          const note = element.querySelector<HTMLInputElement>('input[name="note"]');
          if (!first || !note) throw new Error('Missing shared form controls');
          note.removeAttribute('id');
          if (kind === 'upload-name') first.name = 'elements';
          else if (kind === 'control-name') note.name = 'elements';
          else note.id = 'elements';
          element.id = 'shared-documents-form';
          // An external native placeholder must precede the managed files in native order.
          const external = document.createElement('input');
          external.type = 'file';
          external.name = 'docs';
          external.setAttribute('form', element.id);
          element.before(external);
          // Force the repair path even when DataTransfer populated the inputs successfully.
          for (const input of element.querySelectorAll<HTMLInputElement>('input[hidden]')) {
            input.value = '';
          }
          const isShadowed = element.elements instanceof HTMLInputElement;
          const read = () =>
            Promise.all(
              Array.from(new FormData(element), async ([name, value]) => [
                name,
                typeof value === 'string' ? value : `${value.name}:${await value.text()}`,
              ]),
            );
          return { isShadowed, first: await read(), repeated: await read() };
        }, shadow);
        const expected = [
          ['docs', ':'],
          ['docs', 'existing'],
          ['docs', ':'],
          [shadow === 'upload-name' ? 'elements' : 'docs', 'a.txt:first'],
          [shadow === 'control-name' ? 'elements' : 'note', 'For review'],
          ['docs', 'reference'],
          ['docs', 'b.txt:second'],
          ['docs', ':'],
          ['docs', 'last'],
        ];
        expect(result).toEqual({ isShadowed: true, first: expected, repeated: expected });
      });
    }

    test(`UIC-FILE-UPLOAD-4.2 preserves shared controls and native files ${fallback ? 'without' : 'with'} DataTransfer`, async ({
      page,
      lab,
    }) => {
      if (fallback) {
        await page.addInitScript(() => {
          Object.defineProperty(window, 'DataTransfer', { value: undefined, configurable: true });
        });
      }
      await lab.open('file-upload');
      const form = page.locator('[data-lab-form="shared-uploads"]');
      const sample = (name: string, content: string) => ({
        name,
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      });
      await form
        .getByLabel('Native document', { exact: true })
        .setInputFiles(sample('zero.txt', ''));
      await upload(page, 'shared-first')
        .locator('input[type="file"]:not([hidden])')
        .setInputFiles([sample('a.txt', 'first'), sample('b.txt', 'second')]);
      await upload(page, 'shared-second')
        .locator('input[type="file"]:not([hidden])')
        .setInputFiles(sample('c.txt', 'third'));
      await expect(form.locator('.ui-file-upload__file-name')).toHaveText([
        'a.txt',
        'b.txt',
        'c.txt',
      ]);
      const expected = [
        ['docs', 'existing'],
        ['docs', { name: 'zero.txt', size: 0, type: 'text/plain', text: '' }],
        ['docs', { name: 'a.txt', size: 5, type: 'text/plain', text: 'first' }],
        ['docs', { name: 'b.txt', size: 6, type: 'text/plain', text: 'second' }],
        ['note', 'For review'],
        ['docs', 'reference'],
        ['docs', { name: 'c.txt', size: 5, type: 'text/plain', text: 'third' }],
        ['docs', { name: '', size: 0, type: 'application/octet-stream', text: '' }],
        ['docs', 'last'],
        ['action', 'send'],
      ];
      const read = (clearSecond = false) =>
        form.evaluate(async (element: HTMLFormElement, needsRepair) => {
          if (needsRepair) {
            const input = element.querySelector<HTMLInputElement>(
              '[data-lab-upload="shared-second"] input[hidden]',
            );
            if (input) input.value = '';
          }
          const submitter = element.querySelector<HTMLButtonElement>('button[type="submit"]');
          const data = new FormData(element, submitter);
          return Promise.all(
            Array.from(data, async ([name, value]) => [
              name,
              typeof value === 'string'
                ? value
                : {
                    name: value.name,
                    size: value.size,
                    type: value.type,
                    text: await value.text(),
                  },
            ]),
          );
        }, clearSecond);
      expect(await read()).toEqual(expected);
      expect(await read()).toEqual(expected);
      if (!fallback) {
        // Leave one synchronized upload beside one that needs repair in the same native event.
        expect(await read(true)).toEqual(expected);
      }
      await form.getByRole('button', { name: 'Send documents' }).click();
      await expect(page.locator('[data-lab-output="shared-sent"]')).toHaveText(
        'docs: existing, docs: zero.txt, docs: a.txt, docs: b.txt, note: For review, docs: reference, docs: c.txt, docs: (empty file), docs: last',
      );
      const immediate = await form.evaluate(async (element: HTMLFormElement) => {
        element.reset();
        // Construct in the reset's task, before useNativeReset can repopulate either hidden input.
        const data = new FormData(element);
        return Promise.all(
          Array.from(data, async ([name, value]) => [
            name,
            typeof value === 'string'
              ? value
              : {
                  name: value.name,
                  size: value.size,
                  type: value.type,
                  text: await value.text(),
                },
          ]),
        );
      });
      const resetExpected = expected.slice(0, -1);
      resetExpected[1] = [
        'docs',
        { name: '', size: 0, type: 'application/octet-stream', text: '' },
      ];
      expect(immediate).toEqual(resetExpected);
      await expect(form.locator('.ui-file-upload__file-name')).toHaveText([
        'a.txt',
        'b.txt',
        'c.txt',
      ]);
    });
  }

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

  test('UIC-FILE-UPLOAD-4.2 UIC-FIELD-2.6 follows the form its input is moved to', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const form = page.locator('[data-lab-form="upload"]');
    const other = page.locator('[data-lab-form="upload-other"]');
    await form
      .locator('input[type="file"]:not([hidden])')
      .setInputFiles([
        { name: 'Signed.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(64) },
      ]);
    await expect(form.locator('.ui-file-upload__file')).toHaveCount(1);
    await form.getByRole('button', { name: 'Move the files to the other form' }).click();
    await expect(form.locator('input[name="attachments"]')).toHaveAttribute(
      'form',
      'upload-other-form',
    );
    // A reset of the new form keeps the listed files submitted with it, and the old form has none.
    await other.getByRole('button', { name: 'Reset the other form' }).click();
    await other.getByRole('button', { name: 'Send the other form' }).click();
    await expect(page.locator('[data-lab-output="other-form-sent"]')).toHaveText('Signed.pdf');
    await other.evaluate((element: HTMLFormElement) => {
      element.reset();
      element.requestSubmit();
    });
    await expect(page.locator('[data-lab-output="other-form-sent"]')).toHaveText('Signed.pdf');
    await form.evaluate((element: HTMLFormElement) => element.reset());
    expect(
      await form.evaluate((element: HTMLFormElement) =>
        new FormData(element).getAll('attachments'),
      ),
    ).toEqual([]);
    await form.getByRole('button', { name: 'Move the files back' }).click();
    await form.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('[data-lab-output="form-sent"]')).toHaveText('Signed.pdf');
  });

  test('UIC-FILE-UPLOAD-4.2 keeps submitting the listed files after a native reset', async ({
    page,
    lab,
  }) => {
    await lab.open('file-upload');
    const form = page.locator('[data-lab-form="upload"]');
    const sent = page.locator('[data-lab-output="form-sent"]');
    const pdf = (name: string) => ({ name, mimeType: 'application/pdf', buffer: Buffer.alloc(64) });
    await form.locator('input[type="file"]:not([hidden])').setInputFiles([pdf('Signed.pdf')]);
    await expect(form.locator('.ui-file-upload__file')).toHaveCount(1);
    const formData = () =>
      form.evaluate((element: HTMLFormElement) =>
        new FormData(element).getAll('attachments').map((entry) => {
          const file = entry as File;
          return `${file.name}:${file.size}`;
        }),
      );
    expect(await formData()).toEqual(['Signed.pdf:64']);

    await form.getByRole('button', { name: 'Reset' }).click();
    await expect(form.locator('.ui-file-upload__file')).toHaveCount(1);
    expect(await formData()).toEqual(['Signed.pdf:64']);
    await form.getByRole('button', { name: 'Send' }).click();
    await expect(sent).toHaveText('Signed.pdf');

    // A submit in the same task as the reset, before the input is filled again.
    const immediate = await form.evaluate((element: HTMLFormElement) => {
      element.reset();
      const valid = element.checkValidity();
      const names = new FormData(element)
        .getAll('attachments')
        .map((entry) => (entry as File).name);
      return { valid, names };
    });
    expect(immediate).toEqual({ valid: true, names: ['Signed.pdf'] });
    await expect
      .poll(() =>
        form.evaluate(
          (element) =>
            element.querySelector<HTMLInputElement>('input[name="attachments"]')?.files?.length,
        ),
      )
      .toBe(1);

    // A cancelled reset changes nothing.
    await form.evaluate((element: HTMLFormElement) => {
      element.addEventListener('reset', (event) => event.preventDefault(), { once: true });
      element.reset();
    });
    expect(await formData()).toEqual(['Signed.pdf:64']);
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

test('UIC-FORMAT-BYTES-1.1 shows formatBytes in a host-side snippet', async ({ page, lab }) => {
  await lab.open('file-upload');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call("formatBytes(512, 'en-US')")).toHaveText('512 B');
  await expect(call("formatBytes(1536, 'en-US')")).toHaveText('1.5 KB');
  await expect(call("formatBytes(5 * 1024 ** 2, 'fr-FR')")).toHaveText(/^5,0\sMB$/);
});
