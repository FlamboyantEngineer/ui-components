import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

function cell(page: Page, status: string, removable: string, kind: string) {
  return matrixCell(page, `status=${status} removable=${removable} kind=${kind}`);
}

async function settledViewer(page: Page) {
  const overlay = page.locator('.ui-modal.ui-media-viewer');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
}

test.describe('Chat Attachment lab', () => {
  test('UIC-CHAT-ATTACHMENT-1.1 UIC-CHAT-ATTACHMENT-1.2 UIC-CHAT-ATTACHMENT-1.3 UIC-CHAT-ATTACHMENT-1.6 shows every kind as a thumbnail or a chip, accessibly', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const image = cell(page, 'complete', 'no', 'image').locator('.ui-chat-attachment');
    await expect(image).toHaveAttribute('data-display', 'thumbnail');
    const thumbnail = image.getByRole('img', { name: 'Harbour.svg' });
    await expect(thumbnail).toBeVisible();
    await expect(thumbnail).toHaveAttribute('referrerpolicy', 'no-referrer');
    await expect(thumbnail).toHaveAttribute('loading', 'lazy');
    for (const kind of ['pdf', 'archive', 'text', 'file']) {
      const chip = cell(page, 'complete', 'no', kind).locator('.ui-chat-attachment');
      await expect(chip).toHaveAttribute('data-kind', kind);
      await expect(chip).toHaveAttribute('data-display', 'chip');
    }
    const pdf = cell(page, 'complete', 'no', 'pdf');
    await expect(pdf.locator('.ui-chat-attachment__size')).toHaveText('470.7 KB');
    await expect(pdf.locator('.ui-chat-attachment__icon')).toHaveAttribute(
      'data-glyph',
      'file-pdf',
    );
    await expect(pdf.getByRole('link', { name: 'Download Trip itinerary.pdf' })).toHaveAttribute(
      'download',
      'Trip itinerary.pdf',
    );
    await expect(
      page.locator('[data-lab-demo="no-url"] .ui-chat-attachment__icon'),
    ).toHaveAttribute('data-glyph', 'image');
    await lab.expectAccessible();
  });

  test('UIC-CHAT-ATTACHMENT-1.4 UIC-CHAT-ATTACHMENT-1.5 UIC-CHAT-ATTACHMENT-1.7 shows progress, errors and the remove button', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const uploading = cell(page, 'uploading-75', 'no', 'archive');
    const bar = uploading.getByRole('progressbar', { name: 'Uploading Photos from the coast.zip' });
    await expect(bar).toHaveAttribute('aria-valuenow', '75');
    await expect(bar).toHaveAttribute('aria-valuetext', '75%');
    await expect(uploading.getByRole('link')).toHaveCount(0);
    const unmeasured = cell(page, 'uploading-unknown', 'no', 'text').getByRole('progressbar');
    await expect(unmeasured).not.toHaveAttribute('aria-valuenow');
    const failed = cell(page, 'error', 'yes', 'pdf');
    await expect(failed.getByRole('alert')).toContainText(
      'Trip itinerary.pdf could not be uploaded.',
    );
    await failed.getByRole('button', { name: 'Retry' }).click();
    await expect(page.locator('[data-lab-output="action"]')).toHaveText('retry Trip itinerary.pdf');
    await failed.getByRole('button', { name: 'Remove Trip itinerary.pdf' }).click();
    await expect(page.locator('[data-lab-output="action"]')).toHaveText(
      'remove Trip itinerary.pdf',
    );
    await expect(
      cell(page, 'error', 'no', 'pdf').getByRole('button', { name: /^Remove/ }),
    ).toHaveCount(0);
  });

  test('UIC-CHAT-ATTACHMENT-2.1 UIC-CHAT-ATTACHMENT-2.2 opens the media viewer from the gallery and returns focus', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const gallery = page.locator('[data-lab-demo="gallery"]');
    const list = gallery.getByRole('list', { name: 'Trip photos and plans' });
    await expect(list.getByRole('listitem')).toHaveCount(6);
    await expect(list.getByRole('button', { name: /^View / })).toHaveCount(4);
    const opener = list.getByRole('button', { name: 'View Tower.svg' });
    await opener.click();
    await settledViewer(page);
    const dialog = page.getByRole('dialog', { name: 'Tower.svg' });
    await expect(dialog.locator('.ui-media-viewer__counter')).toHaveText('2 of 4');
    await lab.expectAccessible('.ui-modal');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('dialog', { name: 'Meadow.svg' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test('UIC-CHAT-ATTACHMENT-1.2 UIC-CHAT-ATTACHMENT-2.1 lists the thumbnail and views and downloads the original', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const list = page
      .locator('[data-lab-demo="thumbnails"]')
      .getByRole('list', { name: 'Thumbnails and originals' });
    const lagoon = list.getByRole('button', { name: 'View Lagoon.svg' });
    await expect(lagoon.locator('img')).toHaveAttribute('src', /Thumbnail/);
    await expect(lagoon.locator('img')).not.toHaveAttribute('src', /Original/);
    await lagoon.click();
    await settledViewer(page);
    const dialog = page.getByRole('dialog', { name: 'Lagoon.svg' });
    await expect(dialog.locator('.ui-media-viewer__image')).toHaveAttribute('src', /Original/);
    await expect(dialog.getByRole('link', { name: 'Download Lagoon.svg' })).toHaveAttribute(
      'href',
      /Original/,
    );
    await page.keyboard.press('ArrowRight');
    const cove = page.getByRole('dialog', { name: 'Cove.svg' });
    await expect(cove.locator('.ui-media-viewer__image')).toHaveAttribute(
      'src',
      /Thumbnail%20only/,
    );
    await expect(cove.getByRole('link', { name: 'Download Cove.svg' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(lagoon).toBeFocused();
  });

  test('UIC-CHAT-ATTACHMENT-2.2 ends the viewer when its gallery empties and opens nothing once refilled', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const demo = page.locator('[data-lab-demo="emptying"]');
    await demo.getByRole('button', { name: 'Clear in a moment' }).click();
    await demo.getByRole('button', { name: 'View Harbour.svg' }).click();
    await settledViewer(page);
    await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
    const add = demo.getByRole('button', { name: 'Add a photo' });
    await expect(add).toBeFocused();
    await add.click();
    await expect(demo.getByRole('button', { name: 'View Meadow.svg' })).toBeVisible();
    await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
    await expect(add).toBeFocused();
  });

  test('UIC-CHAT-ATTACHMENT-2.3 UIC-CHAT-ATTACHMENT-2.4 keeps the focus in the composer strip as files are removed', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const strip = page.locator('[data-lab-demo="composer"]');
    const remove = (name: string) => strip.getByRole('button', { name: `Remove ${name}` });
    await remove('Trip itinerary.pdf').focus();
    await page.keyboard.press('Enter');
    await expect(remove('Photos from the coast.zip')).toBeFocused();
    await remove('Dunes.svg').focus();
    await page.keyboard.press('Enter');
    await expect(remove('Packing list.txt')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(remove('Photos from the coast.zip')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(remove('Harbour.svg')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(strip.getByRole('list', { name: 'Files to send' })).toHaveCount(0);
    await expect(strip.getByRole('textbox', { name: 'Message' })).toBeFocused();
  });

  test('UIC-CHAT-ATTACHMENT-1.5 UIC-CHAT-ATTACHMENT-2.3 retries a failed upload from the composer strip', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const strip = page.locator('[data-lab-demo="composer"]');
    const archive = strip
      .locator('.ui-chat-attachment')
      .filter({ hasText: 'Photos from the coast.zip' });
    await expect(archive).toHaveAttribute('data-status', 'error');
    await expect(archive.getByRole('alert')).toHaveText(/The connection dropped\./);
    await archive.getByRole('button', { name: 'Retry' }).focus();
    await page.keyboard.press('Enter');
    await expect(
      archive.getByRole('button', { name: 'Remove Photos from the coast.zip' }),
    ).toBeFocused();
    await expect(archive).not.toHaveAttribute('data-status', 'error');
    await expect(archive).toHaveAttribute('data-status', 'complete');
    await expect(
      archive.getByRole('link', { name: 'Download Photos from the coast.zip' }),
    ).toBeVisible();
  });

  test('UIC-CHAT-ATTACHMENT-1.2 asks the owner for a preview from a standalone thumbnail', async ({
    page,
    lab,
  }) => {
    await lab.open('chat-attachment');
    const demo = page.locator('[data-lab-demo="standalone"]');
    await demo.getByRole('button', { name: 'View Harbour.svg' }).click();
    await expect(demo.locator('[data-lab-output="previews"]')).toHaveText('1');
  });
});
