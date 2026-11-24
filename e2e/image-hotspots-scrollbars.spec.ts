import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

// Headless Chromium hides scrollbars by default. Classic scrollbars take room in the viewport.
test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test('UIC-IMAGE-HOTSPOTS-1.2 keeps the canvas and hotspot steady when classic scrollbars appear', async ({
  page,
  lab,
}) => {
  await lab.open('image-hotspots');
  const demo = page.locator('[data-lab-demo="narrow-panel"]');
  const viewport = demo.getByRole('group', { name: 'Narrow front panel controls' });
  const canvas = demo.locator('.ui-image-hotspots__canvas');
  const power = demo.getByRole('button', { name: 'Power' });
  const zoom = demo.locator('.ui-zoom-control__value');
  await expect(canvas).toHaveCSS('width', '492px');
  await viewport.focus();
  await page.keyboard.press('+');
  await expect(zoom).toHaveText('125%');

  const sizes = await canvas.evaluate(async (element) => {
    const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const samples = new Set<string>();
    for (let i = 0; i < 24; i += 1) {
      await frame();
      if (i >= 6) samples.add(`${element.style.width} × ${element.style.height}`);
    }
    return [...samples];
  });
  expect(sizes).toEqual(['615px × 307.5px']);
  expect(await viewport.evaluate((element) => element.clientWidth)).toBeLessThan(492);

  await expect(async () => {
    const image = requireDefined(await canvas.boundingBox());
    const hotspot = requireDefined(await power.boundingBox());
    expect((hotspot.x - image.x) / image.width).toBeCloseTo(0.1, 2);
    expect((hotspot.y - image.y) / image.height).toBeCloseTo(0.25, 2);
    expect(hotspot.width / image.width).toBeCloseTo(0.1, 2);
    expect(hotspot.height / image.height).toBeCloseTo(0.15, 2);
  }).toPass();

  await demo.getByRole('button', { name: 'Reset zoom' }).click();
  await expect(zoom).toHaveText('100%');
  await expect(canvas).toHaveCSS('width', '492px');
  await expect(async () => {
    const fits = await viewport.evaluate(
      (element) =>
        element.scrollWidth === element.clientWidth &&
        element.scrollHeight === element.clientHeight,
    );
    expect(fits).toBe(true);
  }).toPass();
});
