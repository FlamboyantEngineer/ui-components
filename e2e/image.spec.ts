import { expect, matrixCell, test } from './fixtures.js';

test.describe('Image lab', () => {
  test('UIC-IMAGE-1.1 UIC-IMAGE-1.2 UIC-IMAGE-1.5 UIC-IMAGE-2.3 UIC-IMAGE-2.4 loads, falls back and names each image once', async ({
    page,
    lab,
  }) => {
    await lab.open('image');
    const cell = (source: string) => matrixCell(page, `source=${source}`).locator('.ui-image');
    await expect(cell('loads')).toHaveAttribute('data-status', 'loaded');
    await expect(
      cell('loads').getByRole('img', { name: 'A lake under a pale sky' }),
    ).toHaveJSProperty('naturalWidth', 160);
    await expect(cell('backup')).toHaveAttribute('data-status', 'loaded');
    await expect(cell('backup').locator('img')).toHaveAttribute('src', /^data:image\/svg\+xml/);
    await expect(cell('fails')).toHaveAttribute('data-status', 'error');
    const fallback = cell('fails').getByRole('img', { name: 'A missing photo' });
    await expect(fallback).toHaveClass(/ui-image__fallback/);
    // The fallback keeps the reserved 160 by 100 box.
    const box = await fallback.boundingBox();
    expect(box?.width).toBe(160);
    expect(box?.height).toBe(100);
    await expect(cell('decorative')).toHaveAttribute('data-status', 'error');
    await expect(cell('decorative').getByRole('img')).toHaveCount(0);
    await lab.expectAccessible();
  });

  test('UIC-IMAGE-2.5 retries a failed image', async ({ page, lab }) => {
    await lab.open('image');
    const image = matrixCell(page, 'source=fails, retry').locator('.ui-image');
    await expect(image).toHaveAttribute('data-status', 'error');
    const retry = image.getByRole('button', { name: 'Reload image' });
    await retry.focus();
    await page.keyboard.press('Enter');
    // The source is still broken, so the new request fails into the fallback again.
    await expect(image).toHaveAttribute('data-status', 'error');
    await expect(image.getByRole('img', { name: 'A missing chart' })).toBeVisible();
  });

  test('UIC-IMAGE-1.3 UIC-IMAGE-1.4 UIC-IMAGE-2.1 loads a lazy image as it nears the view', async ({
    page,
    lab,
  }) => {
    await lab.open('image');
    const gallery = page.locator('[data-lab-demo="lazy"]');
    const image = gallery.locator('.ui-image');
    await expect(image.locator('img')).toHaveAttribute('loading', 'lazy');
    await expect(image).toHaveAttribute('data-status', 'loading');
    await expect(image.locator('.ui-image__placeholder')).toHaveText('Loading…');
    await gallery.evaluate((node) => node.scrollTo({ top: node.scrollHeight }));
    await expect(image).toHaveAttribute('data-status', 'loaded');
    await expect(image.locator('.ui-image__placeholder')).toHaveCount(0);
  });

  test('UIC-IMAGE-1.3 starts each new source afresh', async ({ page, lab }) => {
    await lab.open('image');
    const demo = page.locator('[data-lab-demo="switch"]');
    const status = demo.locator('[data-lab-output="status"]');
    await expect(status).toHaveText('loaded');
    await demo.getByRole('button', { name: 'Use a broken source' }).click();
    await expect(status).toHaveText('error');
    await demo.getByRole('button', { name: 'Use a working source' }).click();
    await expect(status).toHaveText('loaded');
    await expect(demo.getByRole('img', { name: 'A lake under a pale sky' })).toHaveJSProperty(
      'tagName',
      'IMG',
    );
  });
});
