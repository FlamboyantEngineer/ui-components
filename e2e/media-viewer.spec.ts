import type { Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function settled(page: Page) {
  const overlay = page.locator('.ui-modal.ui-media-viewer');
  await expect(overlay).toBeVisible();
  await expect(overlay).not.toHaveAttribute('data-entering');
  await expect(page.locator('.ui-media-viewer__stage')).toHaveAttribute('data-status', 'loaded');
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

  for (const width of [1280, 360]) {
    test(`UIC-MEDIA-VIEWER-1.1 opens above the lab's sticky bar at ${width} pixels wide`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize({ width, height: 640 });
      await lab.open('media-viewer');
      // Scrolled, so the sticky bar sits over the page's top edge.
      const opener = page.locator('[data-lab-open="mixed-first"]');
      await opener.scrollIntoViewIfNeeded();
      await page.mouse.wheel(0, 200);
      await opener.click();
      await settled(page);
      const dialog = page.getByRole('dialog');
      const controls = [
        dialog.locator('.ui-modal__title'),
        dialog.getByRole('button', { name: /^Close/ }),
        dialog.getByRole('button', { name: 'Next' }),
        dialog.getByRole('link', { name: /Download/ }),
      ];
      for (const control of controls) {
        await expect(control).toBeVisible();
        // The point under the control's centre belongs to it, not to the bar.
        const hit = await control.evaluate((node) => {
          const box = node.getBoundingClientRect();
          const frame = node.closest('.ui-modal__dialog')?.getBoundingClientRect();
          const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          // Inside the viewer's frame, not cut off at a narrow width, and the topmost thing there.
          const inside =
            !!frame && box.width > 0 && box.left >= frame.left && box.right <= frame.right + 0.5;
          return inside && top !== null && node.contains(top);
        });
        expect(hit, await control.evaluate((node) => node.outerHTML.slice(0, 80))).toBe(true);
      }
      await dialog.getByRole('button', { name: 'Next' }).click();
      await expect(dialog.locator('.ui-media-viewer__counter')).toHaveText(/^2 of /);
      await page.keyboard.press('Escape');
      await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
      await expect(opener).toBeFocused();
    });
  }

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

  test('UIC-MEDIA-VIEWER-1.2 keeps focus on the next button at the end of the set', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="photos-first"]').click();
    await settled(page);
    const counter = page.locator('.ui-media-viewer__counter');
    const next = page.locator('.ui-media-viewer__next');
    await next.focus();
    await page.keyboard.press('Enter');
    await expect(counter).toHaveText('2 of 3');
    await page.keyboard.press('Enter');
    await expect(counter).toHaveText('3 of 3');
    await expect(next).toBeFocused();
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(counter).toHaveText('2 of 3');
  });

  test('UIC-MEDIA-VIEWER-1.4 pans a zoomed image with the arrows and moves with the page keys', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="photos-first"]').click();
    await settled(page);
    const counter = page.locator('.ui-media-viewer__counter');
    const viewport = page.locator('.ui-media-viewer__viewport');
    await expect(viewport).toBeFocused();
    for (let step = 0; step < 4; step += 1) await page.keyboard.press('+');
    await expect
      .poll(() => viewport.evaluate((element) => element.scrollWidth > element.clientWidth))
      .toBe(true);
    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('1 of 3');
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press('PageDown');
    await expect(counter).toHaveText('2 of 3');
    await page.keyboard.press('ArrowRight');
    await expect(counter).toHaveText('3 of 3');
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

  test('UIC-MEDIA-VIEWER-1.3 requests only the thumbnails near the strip of a large set', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    const requested = new Set<string>();
    page.on('request', (request) => {
      const photo = new URL(request.url()).searchParams.get('photo');
      if (photo) requested.add(photo);
    });
    await page.locator('[data-lab-open="large"]').click();
    await settled(page);
    const strip = page.getByRole('group', { name: 'Thumbnails' });
    await expect(strip.getByRole('button')).toHaveCount(100);
    await expect.poll(() => requested.has('1')).toBe(true);
    expect(requested.size).toBeLessThan(60);
    expect(requested.has('100')).toBe(false);
    // Moving to a far photo shows it, and scrolling the strip there loads its thumbnail.
    const last = strip.getByRole('button', { name: 'Photo 100.svg' });
    await last.scrollIntoViewIfNeeded();
    await last.click();
    await expect(title(page)).toHaveText('Photo 100.svg');
    await expect(page.locator('.ui-media-viewer__stage')).toHaveAttribute('data-status', 'loaded');
    await expect
      .poll(() => last.locator('img').evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  });

  test('UIC-MEDIA-VIEWER-2.4 shows a failed image with Retry and loads the URL the page refreshes', async ({
    page,
    lab,
  }) => {
    // Answer the broken URLs with bytes that are no image, which fail as a decode error without the
    // console error a 404 logs.
    await page.route(/expired-link\.svg|missing\.svg/, (route) =>
      route.fulfill({ status: 200, contentType: 'image/svg+xml', body: 'not an image' }),
    );
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="failing"]').click();
    const stage = page.locator('.ui-media-viewer__stage');
    // The page answers the expired link's failure with a fresh URL, which loads.
    await expect(stage).toHaveAttribute('data-status', 'loaded');
    await expect(page.locator('[data-lab-output="image-errors"]')).toHaveText('Expired link.svg');
    await expect(page.getByRole('button', { name: 'Rotate clockwise' })).toBeEnabled();
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(stage).toHaveAttribute('data-status', 'failed');
    const alert = page.getByRole('alert');
    await expect(alert).toHaveText(/“Missing.svg” could not be loaded./);
    await expect(page.getByRole('button', { name: 'Rotate clockwise' })).toBeDisabled();
    await expect(page.getByRole('link', { name: /Download/ })).toHaveCount(0);
    await alert.getByRole('button', { name: 'Retry' }).click();
    await expect(stage).toHaveAttribute('data-status', 'failed');
    await expect(page.locator('[data-lab-output="image-errors"]')).toHaveText(
      'Expired link.svg, Missing.svg, Missing.svg',
    );
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
    await lab.expectAccessible('.ui-modal');
  });

  test('UIC-MEDIA-VIEWER-3.1 keeps the caller rendering of each file apart', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="drafts"]').click();
    await settled(page);
    const agenda = page.getByRole('textbox', { name: 'Draft for Agenda.txt' });
    await agenda.fill('Changed agenda');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('textbox', { name: 'Draft for Minutes.txt' })).toHaveValue(
      'Notes for Minutes.txt',
    );
    // Page Down from a control inside the replaced rendering moves on and keeps focus in the viewer.
    await page.getByRole('button', { name: 'Clear the draft for Minutes.txt' }).focus();
    await page.keyboard.press('PageDown');
    await expect(title(page)).toHaveText('Follow-ups.txt');
    await expect(page.getByRole('group', { name: 'Follow-ups.txt, viewer' })).toBeFocused();
  });

  test('UIC-MEDIA-VIEWER-1.1 stays closed while its list empties and refills', async ({
    page,
    lab,
  }) => {
    await lab.open('media-viewer');
    await page.locator('[data-lab-open="refreshing"]').click();
    await settled(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
    await page.locator('[data-lab-refresh="refreshing"]').click();
    await expect(page.locator('[data-lab-output="refreshing-count"]')).toHaveText('0');
    await expect(page.locator('[data-lab-output="refreshing-count"]')).toHaveText('3');
    await expect(page.locator('.ui-media-viewer')).toHaveCount(0);
  });
});
