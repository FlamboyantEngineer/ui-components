import { expect, test } from './fixtures.js';

// Headless Chromium hides scrollbars by default; these tests need them to take room, as they do in
// a desktop browser with classic scrollbars.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test.describe('Media Viewer lab with classic scrollbars', () => {
  // Sizes where a fit that followed the viewport's scrollbars alternated between two widths every
  // other frame: at 100%, from the rounded client box, and at 125%, from the zoomed image's own
  // scrollbars.
  for (const { width, height, zoom } of [
    { width: 600, height: 500, zoom: '100%' },
    { width: 692, height: 537, zoom: '100%' },
    { width: 600, height: 574, zoom: '125%' },
  ]) {
    test(`UIC-MEDIA-VIEWER-2.1 the image keeps one size at ${zoom} in a ${width}×${height} window`, async ({
      page,
      lab,
    }) => {
      await page.setViewportSize({ width, height });
      await lab.open('media-viewer');
      await page.locator('[data-lab-open="photos-first"]').click();
      await expect(page.locator('.ui-media-viewer__stage')).toHaveAttribute(
        'data-status',
        'loaded',
      );
      const value = page.locator('.ui-zoom-control__value');
      if (zoom !== '100%') await page.getByRole('button', { name: 'Zoom in' }).click();
      await expect(value).toHaveText(zoom);
      const widths = await page.evaluate(async () => {
        const image = document.querySelector<HTMLElement>('.ui-media-viewer__image');
        const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
        for (let settle = 0; settle < 6; settle++) await frame();
        const seen: string[] = [];
        for (let sample = 0; sample < 20; sample++) {
          await frame();
          seen.push(image?.style.width ?? '');
        }
        return [...new Set(seen)];
      });
      expect(widths).toHaveLength(1);
    });
  }
});
