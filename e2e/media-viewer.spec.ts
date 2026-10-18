import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function settled(page: Page) {
  const overlay = page.locator('.ui-modal.ui-media-viewer');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
}

function title(page: Page) {
  return page.locator('.ui-media-viewer .ui-modal__title');
}

test.describe('Media Viewer lab', () => {
  test('UIC-MEDIA-VIEWER-1.1 UIC-MEDIA-VIEWER-1.2 UIC-MEDIA-VIEWER-4.1 opens each set and closes on Escape', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    const opener = page.locator('[data-lab-open="photos-last"]');
    await opener.click();
    await settled(page);
    const dialog = page.getByRole('dialog', { name: 'Meadow.svg' });
    await expect(dialog.locator('.ui-media-viewer__counter')).toHaveText('3 of 3');
    await expect(dialog.getByRole('group', { name: 'Meadow.svg, viewer' })).toBeFocused();
    await expect(dialog.getByRole('button', { name: 'Next' })).toBeDisabled();
    await lab.expectAccessible('.ui-modal');
    await dialog.getByRole('button', { name: 'Previous' }).click();
    await expect(title(page)).toHaveText('Tower.svg');
    await expect(page.locator('.ui-media-viewer .ui-modal__description')).toHaveText(
      'The old tower in the evening.',
    );
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.locator('[data-lab-open="single-first"]').click();
    await settled(page);
    await expect(page.locator('.ui-media-viewer__thumbnails')).toHaveCount(0);
    await expect(page.locator('.ui-media-viewer__previous')).toHaveCount(0);
  });

  test('UIC-MEDIA-VIEWER-1.3 UIC-MEDIA-VIEWER-1.4 moves with thumbnails and arrow keys', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.getByRole('button', { name: 'View Harbour.svg' }).click();
    await settled(page);
    await page.keyboard.press('ArrowRight');
    await expect(title(page)).toHaveText('Tower.svg');
    await expect(page.locator('[data-lab-output="shown"]')).toHaveText('tower');
    const strip = page.getByRole('group', { name: 'Thumbnails' });
    await strip.getByRole('button', { name: 'Meadow.svg' }).click();
    await expect(title(page)).toHaveText('Meadow.svg');
    await expect(strip.getByRole('button', { name: 'Meadow.svg' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(title(page)).toHaveText('Tower.svg');
  });

  test('UIC-MEDIA-VIEWER-2.1 UIC-MEDIA-VIEWER-2.2 fits, zooms, pans and turns an image', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="photos-first"]').click();
    await settled(page);
    const viewport = page.locator('.ui-media-viewer__viewport');
    const image = page.locator('.ui-media-viewer__image');
    await expect(image).toHaveCSS('position', 'absolute');
    const fitted = await image.evaluate((element) => element.getBoundingClientRect().width);
    const room = await viewport.evaluate((element) => element.clientWidth);
    expect(fitted).toBeLessThanOrEqual(room + 1);
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await expect(page.locator('.ui-zoom-control__value')).toHaveText('200%');
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollWidth > element.clientWidth))
      .toBe(true);
    await page.getByRole('button', { name: 'Reset zoom' }).click();
    await page.getByRole('button', { name: 'Rotate clockwise' }).click();
    await expect(image).toHaveAttribute('style', /rotate\(90deg\)/);
    const canvas = page.locator('.ui-media-viewer__canvas');
    const box = await canvas.evaluate((element) => [element.clientWidth, element.clientHeight]);
    expect(box[1]).toBeGreaterThan(box[0] ?? 0);
    await expect(page.getByRole('link', { name: 'Download Harbour.svg' })).toHaveAttribute(
      'download',
      'Harbour.svg',
    );
  });

  test('UIC-MEDIA-VIEWER-3.1 UIC-MEDIA-VIEWER-4.2 shows a PDF in the PDF viewer and offers its download', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="mixed-first"]').click();
    await settled(page);
    await page.keyboard.press('ArrowRight');
    await expect(title(page)).toHaveText('Seasonal report.pdf');
    const stage = page.locator('.ui-media-viewer__stage');
    await expect(stage).toHaveAttribute('data-kind', 'file');
    await expect(stage.locator('.ui-media-viewer__content .ui-pdf-viewer')).toBeVisible();
    await expect(page.locator('.ui-media-viewer__zoom')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Download Seasonal report.pdf' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.ui-media-viewer__fallback')).toHaveText(
      'No preview is available for this file.',
    );
  });

  test('UIC-MEDIA-VIEWER-4.1 passes axe open in the dark theme', async ({ page, lab }) => {
    await lab.open('media-viewer', { theme: 'dark' });
    await page.locator('[data-lab-open="mixed-last"]').click();
    await settled(page);
    await lab.expectAccessible('.ui-modal');
  });
});
