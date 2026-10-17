import type { Locator, Page } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error('Element is not visible');
  return rect;
}

function metrics(viewport: Locator) {
  return viewport.evaluate((node) => ({
    scrollTop: node.scrollTop,
    scrollLeft: node.scrollLeft,
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
    clientWidth: node.clientWidth,
    scrollWidth: node.scrollWidth,
  }));
}

const axisCell = (page: Page, axis: string, scrollbar: string) =>
  page.locator(`[data-lab-cell="axis=${axis} scrollbar=${scrollbar}"]`);

test.describe('Scroll Region lab', () => {
  test('UIC-SCROLL-REGION-1.1 UIC-SCROLL-REGION-1.2 scrolls the viewport along its axes', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    for (const [axis, overflowX, overflowY] of [
      ['x', 'auto', 'hidden'],
      ['y', 'hidden', 'auto'],
      ['both', 'auto', 'auto'],
      ['none', 'hidden', 'hidden'],
    ] as const) {
      const viewport = axisCell(page, axis, 'native').locator('.ui-scroll-region__viewport');
      const style = await viewport.evaluate((node) => {
        const computed = getComputedStyle(node);
        return [computed.overflowX, computed.overflowY];
      });
      expect(style).toEqual([overflowX, overflowY]);
    }
    const region = page.getByRole('region', { name: 'Cities, y axis, native scrollbar' });
    await region.hover();
    await page.mouse.wheel(0, 60);
    await expect.poll(async () => (await metrics(region)).scrollTop).toBeGreaterThan(0);
    await lab.expectAccessible();
  });

  test('UIC-SCROLL-REGION-2.1 UIC-SCROLL-REGION-2.2 draws overlay thumbs only on overflowing axes', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    for (const [axis, vertical, horizontal] of [
      ['x', 0, 1],
      ['y', 1, 0],
      ['both', 1, 1],
      ['none', 0, 0],
    ] as const) {
      const cell = axisCell(page, axis, 'overlay');
      await expect(cell.locator('[role="scrollbar"][aria-orientation="vertical"]')).toHaveCount(
        vertical,
      );
      await expect(cell.locator('[role="scrollbar"][aria-orientation="horizontal"]')).toHaveCount(
        horizontal,
      );
    }
    const cell = axisCell(page, 'y', 'overlay');
    const viewport = cell.locator('.ui-scroll-region__viewport');
    const geometry = await metrics(viewport);
    expect(await viewport.evaluate((node) => (node as HTMLElement).offsetWidth)).toBe(
      geometry.clientWidth,
    );
    const track = await box(cell.locator('.ui-scroll-region__track'));
    const thumb = await box(cell.locator('.ui-scroll-region__thumb'));
    const expected = Math.max(24, (track.height * geometry.clientHeight) / geometry.scrollHeight);
    expect(Math.abs(thumb.height - expected)).toBeLessThan(1);
    expect(thumb.y).toBe(track.y);
  });

  test('UIC-SCROLL-REGION-2.3 scrolls with the keyboard on a focused thumb', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const viewport = page.getByRole('region', { name: 'Cities with overlay scrollbars' });
    const thumb = page
      .getByRole('scrollbar', { name: 'Scroll vertically' })
      .and(page.locator('[aria-controls="overlay-viewport"]'));
    await viewport.focus();
    await page.keyboard.press('Tab');
    await expect(thumb).toBeFocused();
    await page.keyboard.press('End');
    const { scrollHeight, clientHeight } = await metrics(viewport);
    await expect
      .poll(async () => (await metrics(viewport)).scrollTop)
      .toBe(scrollHeight - clientHeight);
    await expect(thumb).toHaveAttribute('aria-valuenow', String(scrollHeight - clientHeight));
    const track = await box(
      page.locator(
        '[data-lab-region="overlay"] .ui-scroll-region__track[data-orientation="vertical"]',
      ),
    );
    await expect
      .poll(async () => {
        const rect = await box(thumb);
        return Math.abs(rect.y + rect.height - (track.y + track.height)) < 1;
      })
      .toBe(true);
    await page.keyboard.press('Home');
    await expect.poll(async () => (await metrics(viewport)).scrollTop).toBe(0);
    await page.keyboard.press('PageDown');
    await expect.poll(async () => (await metrics(viewport)).scrollTop).toBe(clientHeight);
    await page.keyboard.press('ArrowDown');
    await expect.poll(async () => (await metrics(viewport)).scrollTop).toBe(clientHeight + 40);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(async () => (await metrics(viewport)).scrollLeft).toBe(0);
  });

  test('UIC-SCROLL-REGION-2.4 drags a thumb to scroll in proportion', async ({ page, lab }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="overlay"]');
    const viewport = region.locator('.ui-scroll-region__viewport');
    const thumb = region.locator('.ui-scroll-region__thumb[data-orientation="vertical"]');
    await region.scrollIntoViewIfNeeded();
    const track = await box(
      region.locator('.ui-scroll-region__track[data-orientation="vertical"]'),
    );
    const start = await box(thumb);
    const travel = track.height - start.height;
    const x = start.x + start.width / 2;
    await page.mouse.move(x, start.y + 4);
    await page.mouse.down();
    await page.mouse.move(x + 200, start.y + 4 + travel / 2, { steps: 5 });
    await page.mouse.up();
    const { scrollTop, scrollHeight, clientHeight } = await metrics(viewport);
    expect(Math.abs(scrollTop - (scrollHeight - clientHeight) / 2)).toBeLessThan(3);
  });

  test('UIC-SCROLL-REGION-2.5 UIC-SCROLL-REGION-2.6 keeps tracks clear of headers and under short content', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const header = await box(page.locator('[data-lab-region="header"] thead'));
    const vertical = await box(
      page.locator(
        '[data-lab-region="header"] .ui-scroll-region__track[data-orientation="vertical"]',
      ),
    );
    expect(vertical.y).toBeGreaterThanOrEqual(header.y + header.height);

    const lift = page.locator('[data-lab-region="lift"]');
    const content = await box(lift.locator('ol'));
    const horizontal = await box(
      lift.locator('.ui-scroll-region__track[data-orientation="horizontal"]'),
    );
    const region = await box(lift);
    expect(Math.abs(horizontal.y + horizontal.height - (content.y + content.height))).toBeLessThan(
      4,
    );
    expect(region.y + region.height - (horizontal.y + horizontal.height)).toBeGreaterThan(50);
  });

  test('UIC-SCROLL-REGION-2.2 starts a right-to-left horizontal thumb at the right', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="rtl"]');
    const track = await box(region.locator('.ui-scroll-region__track'));
    const thumb = await box(region.locator('.ui-scroll-region__thumb'));
    expect(Math.round(thumb.x + thumb.width)).toBe(Math.round(track.x + track.width));
  });

  test('UIC-SCROLL-REGION-3.1 paints the overview beside the native scrollbar', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    for (const source of ['markers', 'layers']) {
      const host = page.locator(`[data-lab-region="overview-${source}"]`);
      const root = host.locator('.ui-scroll-region');
      await expect(root).toHaveAttribute('data-overview', 'true');
      const overview = host.locator('.ui-scroll-region__overview');
      const viewport = host.locator('.ui-scroll-region__viewport');
      expect((await box(overview)).height).toBe((await metrics(viewport)).clientHeight);
      const style = await overview.evaluate((node) => {
        const computed = getComputedStyle(node);
        return { image: computed.backgroundImage, pointer: computed.pointerEvents };
      });
      expect(style.image).toMatch(/^linear-gradient/);
      expect(style.pointer).toBe('none');
      await expect(overview).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('UIC-SCROLL-STRIP-1.1 UIC-SCROLL-STRIP-1.3 reports hidden edges and scrolls a strip with the wheel', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const strip = page.getByRole('group', { name: 'City chips' });
    await expect(page.locator('[data-lab-output="start"]')).toHaveText('no');
    await expect(page.locator('[data-lab-output="end"]')).toHaveText('yes');
    await strip.hover();
    await page.mouse.wheel(0, 120);
    await expect.poll(() => strip.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
    await expect(page.locator('[data-lab-output="start"]')).toHaveText('yes');
    await page.mouse.wheel(0, 5000);
    await expect(page.locator('[data-lab-output="end"]')).toHaveText('no');
  });
});
