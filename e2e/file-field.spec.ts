import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

function cell(page: Page, state: string, layout: string): Locator {
  return page.locator(`[data-lab-cell="state=${state} layout=${layout}"]`);
}

function field(page: Page, name: string): Locator {
  return page.locator(`[data-lab-field="${name}"]`);
}

test.describe('File Field lab', () => {
  test('UIC-FILE-FIELD-1.1 UIC-FILE-FIELD-2.1 UIC-FILE-FIELD-3.2 draws the states with held, added and removed files', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const resting = cell(page, 'resting', 'label-control');
    await expect(resting.getByRole('button', { name: 'Attachments Add files' })).toBeVisible();
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
