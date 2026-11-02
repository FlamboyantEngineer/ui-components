import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function cell(page: Page, state: string, layout: string): Locator {
  return matrixCell(page, `state=${state} layout=${layout}`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

async function box(locator: Locator) {
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('The element has no box.');
  return bounds;
}

test.describe('File Field lab', () => {
  test('UIC-FILE-FIELD-1.1 UIC-FILE-FIELD-2.1 UIC-FILE-FIELD-3.2 draws the states with held, added and removed files', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const resting = cell(page, 'resting', 'label-control');
    const command = resting.getByRole('button', { name: 'Attachments Add files' });
    await expect(command).toBeVisible();
    const commandId = await command.getAttribute('id');
    await expect(resting.locator('label.ui-field__label')).toHaveAttribute('for', commandId ?? '');
    await expect(resting.locator('.ui-file-upload__file')).toHaveCount(2);
    await expect(resting.getByRole('link', { name: 'Download Report.pdf' })).toHaveAttribute(
      'download',
      'Report.pdf',
    );
    const dirty = cell(page, 'dirty', 'label-control');
    await expect(dirty.locator('.ui-file-upload__file[data-change="added"]')).toHaveText(
      /Notes\.txt/,
    );
    await dirty.getByRole('button', { name: 'Restore Harbour.png' }).click();
    await expect(dirty.locator('.ui-file-field__removed')).toHaveCount(0);
    await expect(dirty.locator('.ui-file-upload__file')).toHaveCount(3);
    await expect(cell(page, 'read-only', 'label-control').getByRole('button')).toHaveCount(0);
    await expect(cell(page, 'pending', 'label-control').locator('.ui-field')).toHaveAttribute(
      'data-validation',
      'pending',
    );
    await lab.expectAccessible();
  });

  test('UIC-FILE-FIELD-3.2 lists removed files below the held files like file rows, with size and download', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    for (const width of ['narrow', 'wide']) {
      const removedField = field(page, `removed-${width}`);
      const group = removedField.getByRole('group', { name: 'Removed files' });
      const chips = group.locator('.ui-file-field__removed');
      await expect(chips).toHaveCount(3);
      const fileBox = await box(removedField.locator('.ui-file-upload__file').last());
      const groupBox = await box(group);
      const fieldBox = await box(removedField);
      expect(groupBox.y).toBeGreaterThanOrEqual(fileBox.y + fileBox.height);
      for (const chip of await chips.all()) {
        const chipBox = await box(chip);
        expect(Math.abs(chipBox.height - fileBox.height), width).toBeLessThanOrEqual(1);
        expect(Math.abs(chipBox.width - fileBox.width), width).toBeLessThanOrEqual(1);
        await expect(chip.locator('.ui-file-field__removed-size')).toBeVisible();
        expect(chipBox.x + chipBox.width).toBeLessThanOrEqual(fieldBox.x + fieldBox.width + 0.5);
        // The struck name keeps its descenders: its box is no shorter than its text.
        const name = chip.locator('del');
        expect(await name.evaluate((node) => node.scrollHeight <= node.clientHeight), width).toBe(
          true,
        );
      }
      const long = chips.filter({ hasText: 'north pier' }).locator('del');
      expect(await long.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    }
    const wide = field(page, 'removed-wide');
    const notes = wide.locator('.ui-file-field__removed', { hasText: 'Notes.txt' });
    const download = notes.getByRole('link', { name: 'Download Notes.txt' });
    await expect(download).toHaveAttribute('download', 'Notes.txt');
    // The long-named file has no download link, and shows none.
    await expect(
      wide.locator('.ui-file-field__removed', { hasText: 'north pier' }).getByRole('link'),
    ).toHaveCount(0);
    const narrow = field(page, 'removed-narrow');
    await narrow.getByRole('button', { name: 'Restore Notes.txt' }).click();
    await expect(narrow.locator('.ui-file-upload__file')).toHaveCount(2);
    await expect(narrow.locator('.ui-file-field__removed')).toHaveCount(2);
    await lab.expectAccessible();
  });

  test('UIC-FILE-FIELD-3.2 stacks untitled removed files right below the held files', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const untitled = field(page, 'removed-wide-untitled');
    const group = untitled.getByRole('group', { name: 'Removed files' });
    await expect(group).toHaveAttribute('data-hide-label', 'true');
    await expect(group.locator('.ui-file-field__removed-label')).toHaveCount(0);
    const lastFile = await box(untitled.locator('.ui-file-upload__file').last());
    const firstRemoved = await box(group.locator('.ui-file-field__removed').first());
    expect(firstRemoved.y - (lastFile.y + lastFile.height)).toBeLessThanOrEqual(8);
    expect(Math.abs(firstRemoved.width - lastFile.width)).toBeLessThanOrEqual(1);

    const all = field(page, 'removed-narrow-untitled-all');
    await expect(all.locator('.ui-file-upload__file')).toHaveCount(0);
    await expect(all.locator('.ui-file-field__removed')).toHaveCount(4);
    await all.getByRole('button', { name: 'Restore Report.pdf' }).click();
    await expect(all.locator('.ui-file-upload__file')).toHaveCount(1);
    await expect(all.locator('.ui-file-field__removed')).toHaveCount(3);
    await expect(
      field(page, 'removed-wide-all').locator('.ui-file-field__removed-label'),
    ).toHaveText('Removed files');
  });

  test('UIC-FILE-FIELD-1.3 UIC-FILE-FIELD-2.3 UIC-FILE-FIELD-2.4 uploads chosen files into the value', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const target = field(page, 'uploads');
    await target.locator('input[type="file"]').setInputFiles([
      { name: 'Plan.txt', mimeType: 'text/plain', buffer: Buffer.from('plan') },
      { name: 'fail-map.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg/>') },
    ]);
    const output = page.locator('[data-lab-output="uploads-value"]');
    await expect(output).toHaveText('Report.pdf | Plan.txt');
    const failed = target.locator('.ui-file-upload__file[data-status="error"]');
    await expect(failed.getByRole('alert')).toHaveText('The upload was interrupted.');
    await target.getByRole('button', { name: 'Remove fail-map.svg' }).click();
    await expect(failed).toHaveCount(0);
    await target.getByRole('button', { name: 'Remove Report.pdf' }).click();
    await expect(output).toHaveText('Plan.txt');
    await expect(target.getByRole('link', { name: 'Download Plan.txt' })).toBeVisible();
  });

  test('UIC-FILE-FIELD-1.4 UIC-FILE-FIELD-1.3 holds one dropped image and refuses others', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const target = field(page, 'single');
    await expect(target.locator('.ui-field__message')).toHaveText('A value is required.');
    await expect(target.locator('.ui-file-upload')).toHaveAttribute('data-invalid', 'true');
    const chooser = target.locator('input[type="file"]');
    await chooser.setInputFiles({
      name: 'Notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('notes'),
    });
    await expect(target.locator('.ui-file-upload__rejections')).toHaveText(
      '1 file is not an accepted type.',
    );
    await chooser.setInputFiles({
      name: 'Dot.png',
      mimeType: 'image/png',
      buffer: Buffer.from('png'),
    });
    await expect(page.locator('[data-lab-output="single-value"]')).toHaveText('Dot.png');
    await expect(target.locator('.ui-field__message')).toHaveText('');
  });

  test('UIC-FILE-FIELD-1.3 UIC-FILE-UPLOAD-2.6 counts a file handed on before the owner lists it', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const target = field(page, 'slow');
    const chooser = target.locator('input[type="file"]');
    await chooser.setInputFiles({
      name: 'One.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('one'),
    });
    await expect(page.locator('[data-lab-output="slow-received"]')).toHaveText('1');
    await chooser.setInputFiles({
      name: 'Two.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('two'),
    });
    await expect(target.locator('.ui-file-upload__rejections')).toHaveText(
      '1 file is over the file limit.',
    );
    await expect(page.locator('[data-lab-output="slow-received"]')).toHaveText('1');
    await expect(page.locator('[data-lab-output="slow-value"]')).toHaveCount(0);
    await expect(target.locator('.ui-file-upload__file')).toHaveCount(1);
    await expect(target.locator('.ui-file-upload__file')).toContainText('One.txt');
  });

  test('UIC-FILE-FIELD-2.2 draws owner previews and actions', async ({ page, lab }) => {
    await lab.open('file-field');
    const target = field(page, 'media');
    await expect(target.locator('.ui-file-upload__file-media video')).toHaveCount(1);
    await target
      .locator('.ui-file-upload__file')
      .nth(1)
      .getByRole('button', { name: 'Open' })
      .click();
    await expect(page.locator('[data-lab-output="opened"]')).toHaveText('Morning song.ogg');
    await lab.expectAccessible();
  });
});
