import type { Locator, Page } from '@playwright/test';

/** The distinct colours drawn inside a swatch's border, read from a screenshot of it. */
export async function swatchInkCount(page: Page, swatch: Locator): Promise<number> {
  const png = (await swatch.screenshot({ animations: 'disabled' })).toString('base64');
  return page.evaluate(async (data) => {
    const blob = await (await fetch(`data:image/png;base64,${data}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    if (!context) return 0;
    context.drawImage(bitmap, 0, 0);
    // Inside the border and away from the rounded corners.
    const inset = Math.ceil(bitmap.width / 4);
    const { data: pixels } = context.getImageData(
      inset,
      inset,
      bitmap.width - inset * 2,
      bitmap.height - inset * 2,
    );
    const inks = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4) {
      inks.add(Array.from(pixels.subarray(index, index + 3)).join(','));
    }
    return inks.size;
  }, png);
}
