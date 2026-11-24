import type { Locator, Page } from '@playwright/test';
import { requireDefined } from '../src/utils/require-defined.js';
import { expect, test } from './fixtures.js';

function frontPanel(page: Page) {
  return page.locator('[data-lab-demo="front-panel"]');
}

/** A hotspot's rectangle in percent of the drawn image, read from their boxes on the page. */
async function placeOnImage(surface: Locator, hotspot: Locator) {
  const image = requireDefined(await surface.locator('.ui-image-hotspots__image').boundingBox());
  const box = requireDefined(await hotspot.boundingBox());
  return {
    x: ((box.x - image.x) / image.width) * 100,
    y: ((box.y - image.y) / image.height) * 100,
    width: (box.width / image.width) * 100,
    height: (box.height / image.height) * 100,
  };
}

async function expectOnPowerSwitch(surface: Locator) {
  const power = surface.getByRole('button', { name: 'Power', exact: true });
  await expect(async () => {
    const place = await placeOnImage(surface, power);
    expect(place.x).toBeCloseTo(10, 0);
    expect(place.y).toBeCloseTo(25, 0);
    expect(place.width).toBeCloseTo(10, 0);
    expect(place.height).toBeCloseTo(15, 0);
  }).toPass();
}

test.describe('Image Hotspots lab', () => {
  test('UIC-IMAGE-HOTSPOTS-1.1 UIC-IMAGE-HOTSPOTS-1.8 renders a named, focusable viewport and passes axe', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = frontPanel(page);
    await expect(demo.locator('.ui-image-hotspots')).toHaveAttribute('data-status', 'loaded');
    const viewport = demo.getByRole('group', { name: 'Front panel controls' });
    await expect(viewport).toHaveClass(/ui-image-hotspots__viewport/);
    await viewport.focus();
    await expect(viewport).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-IMAGE-HOTSPOTS-1.2 UIC-IMAGE-HOTSPOTS-1.3 keeps hotspots on their parts at every zoom and viewport size', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = frontPanel(page);
    const surface = demo.locator('.ui-image-hotspots');
    const viewport = demo.getByRole('group', { name: 'Front panel controls' });
    await expect(surface).toHaveAttribute('data-status', 'loaded');
    await expectOnPowerSwitch(surface);
    // At 100% the whole image fits the viewport.
    await expect(async () => {
      const sizes = await viewport.evaluate((element) => ({
        overflowX: element.scrollWidth - element.clientWidth,
        overflowY: element.scrollHeight - element.clientHeight,
      }));
      expect(sizes.overflowX).toBeLessThanOrEqual(0);
      expect(sizes.overflowY).toBeLessThanOrEqual(0);
    }).toPass();

    await viewport.focus();
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.keyboard.press('=');
    await expect(demo.locator('[data-lab-output="zoom"]')).toHaveText('200');
    await expectOnPowerSwitch(surface);
    await expect(async () => {
      const scrollable = await viewport.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      );
      expect(scrollable).toBe(true);
    }).toPass();
    await viewport.evaluate((element) => element.scrollTo({ left: 0, top: 0 }));
    await expectOnPowerSwitch(surface);

    await page.setViewportSize({ width: 420, height: 700 });
    await expectOnPowerSwitch(surface);
    await page.keyboard.press('-');
    await expect(demo.locator('[data-lab-output="zoom"]')).toHaveText('150');
    await demo.getByRole('button', { name: 'Reset zoom' }).click();
    await expect(demo.locator('[data-lab-output="zoom"]')).toHaveText('100');
    await expectOnPowerSwitch(surface);
  });

  test('UIC-IMAGE-HOTSPOTS-1.2 keeps the centre in place as it zooms, and zooms with the wheel', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = frontPanel(page);
    const zoom = demo.locator('[data-lab-output="zoom"]');
    const viewport = demo.getByRole('group', { name: 'Front panel controls' });
    await expect(demo.locator('.ui-image-hotspots')).toHaveAttribute('data-status', 'loaded');
    // The point of the canvas at the viewport's centre, from 0 to 1 across it.
    const centre = () =>
      viewport.evaluate((element) => {
        const canvas = element.querySelector('.ui-image-hotspots__canvas');
        const box = canvas?.getBoundingClientRect();
        const view = element.getBoundingClientRect();
        if (!box) return null;
        return {
          x: (view.left + view.width / 2 - box.left) / box.width,
          y: (view.top + view.height / 2 - box.top) / box.height,
        };
      });
    await viewport.focus();
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await expect(zoom).toHaveText('150');
    await viewport.evaluate((element) => element.scrollBy({ left: 120, top: 40 }));
    const before = requireDefined(await centre());
    await page.keyboard.press('+');
    await expect(zoom).toHaveText('200');
    await expect(async () => {
      const after = requireDefined(await centre());
      expect(after.x).toBeCloseTo(before.x, 2);
      expect(after.y).toBeCloseTo(before.y, 2);
    }).toPass();

    await viewport.hover();
    await page.mouse.wheel(0, 100);
    await expect(zoom).toHaveText('150');
    await page.mouse.wheel(0, -100);
    await expect(zoom).toHaveText('200');
  });

  test('UIC-IMAGE-HOTSPOTS-1.4 presses hotspots from the keyboard and shows a shared state on both', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = frontPanel(page);
    const outputA = demo.getByRole('button', { name: 'Output A', exact: true });
    const inset = demo.getByRole('button', { name: 'Output A, inset' });
    await expect(outputA).toHaveAttribute('aria-pressed', 'false');
    await outputA.focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-lab-output="log"]')).toHaveText('output-a');
    await expect(outputA).toHaveAttribute('aria-pressed', 'true');
    await expect(inset).toHaveAttribute('aria-pressed', 'true');
    await inset.focus();
    await page.keyboard.press('Space');
    await expect(demo.locator('[data-lab-output="log"]')).toHaveText('output-a, inset-a');
    await expect(outputA).toHaveAttribute('aria-pressed', 'false');
    await expect(inset).toHaveAttribute('aria-pressed', 'false');
    await expect(demo.locator('[data-lab-output="output-a"]')).toHaveText('off');
  });

  test('UIC-IMAGE-HOTSPOTS-1.3 UIC-IMAGE-HOTSPOTS-1.4 keeps keyboard focus on the typed hotspot when order changes', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = page.locator('[data-lab-demo="typed-hotspots"]');
    const numeric = demo.getByRole('button', { name: 'Numeric hotspot' });
    const text = demo.getByRole('button', { name: 'Text hotspot' });
    const actions = demo.locator('[data-lab-output="typed-actions"]');
    await numeric.focus();
    await page.keyboard.press('Enter');
    await expect(actions).toHaveText('number 1');
    await expect(demo.getByRole('button', { name: /hotspot/ }).first()).toHaveAttribute(
      'aria-label',
      'Text hotspot',
    );
    await expect(numeric).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(actions).toHaveText('number 1, number 1');
    await text.focus();
    await page.keyboard.press('Space');
    await expect(actions).toHaveText('number 1, number 1, string 1');
    await expect(text).toBeFocused();
  });

  test('UIC-IMAGE-HOTSPOTS-1.5 UIC-IMAGE-HOTSPOTS-1.6 keeps a disabled hotspot focusable with a visible warning', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = frontPanel(page);
    const fuse = demo.getByRole('button', { name: 'Fuse holder' });
    const warning = demo.locator('.ui-image-hotspots__message', { hasText: 'Fuse missing' });
    await expect(fuse).toHaveAttribute('aria-disabled', 'true');
    await expect(fuse).toHaveAccessibleDescription('Fuse missing');
    await expect(warning).toBeVisible();
    await expect(warning).toHaveAttribute('data-tone', 'warning');
    const fuseBox = requireDefined(await fuse.boundingBox());
    const warningBox = requireDefined(await warning.boundingBox());
    expect(warningBox.y).toBeGreaterThanOrEqual(fuseBox.y + fuseBox.height - 1);
    await fuse.focus();
    await expect(fuse).toBeFocused();
    await page.keyboard.press('Enter');
    await fuse.click({ force: true });
    await expect(demo.locator('[data-lab-output="log"]')).toHaveText('none');

    await demo.getByRole('button', { name: 'Fit the fuse' }).click();
    await expect(fuse).not.toHaveAttribute('aria-disabled');
    await expect(warning).toHaveCount(0);
    await fuse.click();
    await expect(demo.locator('[data-lab-output="log"]')).toHaveText('fuse');
  });

  test('UIC-IMAGE-HOTSPOTS-1.7 loads a new image with its own hotspots, and keeps them when it fails', async ({
    page,
    lab,
  }) => {
    await lab.open('image-hotspots');
    const demo = page.locator('[data-lab-demo="changing-image"]');
    const surface = demo.locator('.ui-image-hotspots');
    await expect(surface).toHaveAttribute('data-status', 'loaded');
    await expect(demo.getByRole('img', { name: 'Drawing of the rear panel' })).toBeVisible();
    await demo.getByRole('button', { name: 'Input 2' }).click();
    await expect(demo.locator('[data-lab-output="pressed"]')).toHaveText('input-2');

    await demo.getByRole('button', { name: 'Front panel' }).click();
    await expect(surface).toHaveAttribute('data-status', 'loaded');
    await expect(demo.getByRole('img', { name: 'Drawing of the front panel' })).toBeVisible();
    await expect(demo.getByRole('button', { name: 'Input 2' })).toHaveCount(0);
    await expectOnPowerSwitch(surface);

    await demo.getByRole('button', { name: 'Unavailable image' }).click();
    await expect(surface).toHaveAttribute('data-status', 'error');
    await expect(demo.getByRole('alert')).toContainText('Side panel');
    await demo.getByRole('button', { name: 'Supply' }).click();
    await expect(demo.locator('[data-lab-output="pressed"]')).toHaveText('supply');
    await lab.expectAccessible('[data-lab-demo="changing-image"]');
  });
});
