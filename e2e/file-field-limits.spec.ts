import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

const output = (page: Page, name: string) => page.locator(`[data-lab-output="${name}"]`);
const field = (page: Page, name: string) => page.locator(`[data-lab-field="${name}"]`);
const text = (name: string) => ({ name, mimeType: 'text/plain', buffer: Buffer.from(name) });

async function choose(target: Locator, ...names: string[]): Promise<void> {
  await target.locator('input[type="file"]').first().setInputFiles(names.map(text));
}

test.describe('File Field lab limits and forms', () => {
  test('UIC-FILE-FIELD-1.3 UIC-FILE-FIELD-3.2 counts held files and uploads against maxFiles', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const target = field(page, 'capped');
    await choose(target, 'fail-one.txt', 'Two.txt');
    await expect(target.locator('.ui-file-upload__rejections')).toHaveText(
      '1 file is over the file limit.',
    );
    await expect(output(page, 'capped-received')).toHaveText('fail-one.txt');
    await expect(target.locator('.ui-file-upload__file[data-status="error"]')).toHaveCount(1);
    await choose(target, 'Three.txt');
    await expect(output(page, 'capped-received')).toHaveText('fail-one.txt');
    await target.getByRole('button', { name: 'Remove fail-one.txt' }).click();
    await choose(target, 'Four.txt');
    await expect(output(page, 'capped-value')).toHaveText('Report.pdf | Harbour.png | Four.txt');

    await target.getByRole('button', { name: 'Remove Report.pdf' }).click();
    await expect(output(page, 'capped-value')).toHaveText('Harbour.png | Four.txt');
    await choose(target, 'Five.txt');
    await expect(output(page, 'capped-value')).toHaveText('Harbour.png | Four.txt | Five.txt');
    const restore = target.getByRole('button', { name: /Restore Report\.pdf/ });
    await expect(restore).toBeDisabled();
    await target.getByRole('button', { name: 'Remove Five.txt' }).click();
    await expect(restore).toBeEnabled();
    await restore.click();
    await expect(output(page, 'capped-value')).toContainText('Report.pdf');
  });

  test('UIC-FILE-FIELD-1.6 UIC-FILE-FIELD-2.4 submits held ids and waits for required files and uploads', async ({
    page,
    lab,
  }) => {
    await lab.open('file-field');
    const form = page.getByRole('form', { name: 'Files form' });
    const submit = form.getByRole('button', { name: 'Submit files' });
    await submit.click();
    await expect(output(page, 'Files submitted')).toHaveText('not yet');
    await expect(output(page, 'Files blockers')).toContainText('Signed copy invalid');

    await choose(field(page, 'form-signed'), 'Signed.txt');
    await expect(
      field(page, 'form-signed').getByRole('link', { name: 'Download Signed.txt' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Pause uploads' }).click();
    await choose(field(page, 'form-attachments'), 'Draft.txt');
    await expect(output(page, 'Files blockers')).toContainText('Form attachments pending');
    await submit.click();
    await expect(output(page, 'Files submitted')).toHaveText('not yet');
    await page.getByRole('button', { name: 'Resume uploads' }).click();
    await expect(output(page, 'Files blockers')).toHaveText('none');
    await submit.click();
    await expect(output(page, 'Files submitted')).toHaveText(
      /^attachments=1, attachments=notes, attachments=file-\d+, signed=file-\d+$/,
    );
    await form.getByRole('button', { name: 'Reset files' }).click();
  });
});
