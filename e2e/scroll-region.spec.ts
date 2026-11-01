import type { Locator, Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

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
  matrixCell(page, `axis=${axis} scrollbar=${scrollbar}`);

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

  test('UIC-SCROLL-REGION-2.4 scrolls the viewport and not the page with the wheel over a thumb', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="overlay"]');
    const viewport = region.locator('.ui-scroll-region__viewport');
    const thumb = region.locator('.ui-scroll-region__thumb[data-orientation="vertical"]');
    await region.scrollIntoViewIfNeeded();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const before = await page.evaluate(() => window.scrollY);
    const start = await box(thumb);
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
    await page.mouse.wheel(0, 40);
    await expect.poll(async () => (await metrics(viewport)).scrollTop).toBe(40);
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('UIC-SCROLL-REGION-2.4 leaves a zoom wheel over a thumb to the browser', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="overlay"]');
    const viewport = region.locator('.ui-scroll-region__viewport');
    const thumb = region.locator('.ui-scroll-region__thumb[data-orientation="vertical"]');
    await region.scrollIntoViewIfNeeded();
    const outcome = await thumb.evaluate((node) => {
      let reachedDocument = false;
      const listen = () => (reachedDocument = true);
      document.addEventListener('wheel', listen, { once: true });
      const event = new WheelEvent('wheel', {
        deltaY: 40,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      node.dispatchEvent(event);
      document.removeEventListener('wheel', listen);
      return { prevented: event.defaultPrevented, reachedDocument };
    });
    expect(outcome).toEqual({ prevented: false, reachedDocument: true });
    expect((await metrics(viewport)).scrollTop).toBe(0);
  });

  test('UIC-SCROLL-REGION-2.7 follows content that shrinks and grows inside a retained child', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="overlay"]');
    const vertical = region.getByRole('scrollbar', { name: 'Scroll vertically' });
    const horizontal = region.getByRole('scrollbar', { name: 'Scroll horizontally' });
    await expect(vertical).toHaveCount(1);
    await page.getByRole('button', { name: 'Show fewer cities' }).click();
    await expect(vertical).toHaveCount(0);
    await expect(horizontal).toHaveCount(1);
    await page.getByRole('button', { name: 'Show all cities' }).click();
    await expect(vertical).toHaveCount(1);
    const viewport = region.locator('.ui-scroll-region__viewport');
    await expect(async () => {
      const track = await box(
        region.locator('.ui-scroll-region__track[data-orientation="vertical"]'),
      );
      const thumb = await box(vertical);
      const size = await metrics(viewport);
      expect(
        Math.abs(
          thumb.height - Math.max(24, (track.height * size.clientHeight) / size.scrollHeight),
        ),
      ).toBeLessThan(1);
    }).toPass();
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

  test('UIC-SCROLL-REGION-2.1 paints the overlay thumb above a sticky header', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="sticky-prose"]');
    await region.scrollIntoViewIfNeeded();
    const header = await box(region.locator('thead'));
    const thumb = await box(
      region.locator(
        '.ui-scroll-region__track[data-orientation="vertical"] .ui-scroll-region__thumb',
      ),
    );
    // The thumb starts at the top, under the sticky header's row.
    expect(thumb.y).toBeLessThan(header.y + header.height);
    const hit = await page.evaluate(
      ({ x, y }) => Boolean(document.elementFromPoint(x, y)?.closest('.ui-scroll-region__thumb')),
      { x: thumb.x + thumb.width / 2, y: thumb.y + 2 },
    );
    expect(hit).toBe(true);
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

  test('UIC-SCROLL-STRIP-1.3 keeps the page still while the wheel pushes the strip past either end', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const strip = page.getByRole('group', { name: 'City chips' });
    await strip.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    const pageTop = await page.evaluate(() => window.scrollY);
    await strip.hover();
    await page.mouse.wheel(0, 5000);
    await expect(page.locator('[data-lab-output="end"]')).toHaveText('no');
    for (const [x, y] of [
      [0, 400],
      [300, 0],
      [200, 120],
    ] as const) {
      await page.mouse.wheel(x, y);
    }
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageTop);
    await page.mouse.wheel(0, -5000);
    await expect(page.locator('[data-lab-output="start"]')).toHaveText('no');
    await page.mouse.wheel(0, -400);
    await page.mouse.wheel(-300, 0);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageTop);
  });

  test('UIC-SCROLL-REGION-2.8 shows scrollbars by their visibility mode', async ({ page, lab }) => {
    await page.clock.install();
    await lab.open('scroll-region');
    const region = (id: string) => page.locator(`[data-lab-visibility="${id}"]`);
    const track = (id: string) => region(id).locator('.ui-scroll-region__track');
    await expect(track('long auto')).toHaveCount(1);
    await expect(track('short auto')).toHaveCount(0);
    await expect(track('short always')).toHaveCount(1);
    await expect(region('short always').getByRole('scrollbar')).toHaveAttribute('tabindex', '-1');
    await expect(track('long scroll')).toHaveCount(0);
    await expect(track('long hover')).toHaveCount(0);

    await region('long hover').hover();
    await expect(region('long hover')).toHaveAttribute('data-hovering', 'true');
    await expect(track('long hover')).toHaveCount(1);
    await page.mouse.move(0, 0);
    await expect(region('long hover')).not.toHaveAttribute('data-hovering');
    await expect(track('long hover')).toHaveCount(0);

    await page.clock.pauseAt(Date.now() + 60_000);
    await region('long scroll')
      .locator('.ui-scroll-region__viewport')
      .evaluate((node) => {
        node.scrollTop = 40;
      });
    await expect(region('long scroll')).toHaveAttribute('data-scrolling', 'true');
    await expect(track('long scroll')).toHaveCount(1);
    await page.clock.runFor(700);
    await expect(region('long scroll')).not.toHaveAttribute('data-scrolling');
    await expect(track('long scroll')).toHaveCount(0);
    await page.clock.resume();
    await lab.expectAccessible();
  });

  test('UIC-SCROLL-REGION-2.9 pages toward a press on the track', async ({ page, lab }) => {
    await lab.open('scroll-region');
    const host = page.locator('[data-lab-region="overlay"]');
    await host.scrollIntoViewIfNeeded();
    const viewport = host.locator('.ui-scroll-region__viewport');
    const track = await box(host.locator('.ui-scroll-region__track[data-orientation="vertical"]'));
    const { clientHeight } = await metrics(viewport);
    await page.mouse.click(track.x + track.width / 2, track.y + track.height - 4);
    await expect.poll(async () => (await metrics(viewport)).scrollTop).toBe(clientHeight);
    const thumb = await box(host.locator('.ui-scroll-region__thumb[aria-orientation="vertical"]'));
    await page.mouse.click(track.x + track.width / 2, thumb.y - 2);
    await expect.poll(async () => (await metrics(viewport)).scrollTop).toBe(0);
  });

  test('UIC-SCROLL-REGION-4.1 publishes the edge distances in both scrollbar modes', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    for (const scrollbar of ['native', 'overlay']) {
      const root = page.locator(`[data-lab-edges="${scrollbar}"]`);
      const viewport = root.locator('.ui-scroll-region__viewport');
      await expect(root).not.toHaveAttribute('data-overflow-y-start');
      await expect(root).toHaveAttribute('data-overflow-y-end', 'true');
      await viewport.evaluate((node) => {
        node.scrollTop = 30;
      });
      await expect(root).toHaveAttribute('data-overflow-y-start', 'true');
      await expect
        .poll(() =>
          root.evaluate((node) =>
            (node as HTMLElement).style.getPropertyValue('--ui-scroll-region-overflow-y-start'),
          ),
        )
        .toBe('30px');
      const { scrollHeight, clientHeight } = await metrics(viewport);
      expect(
        await root.evaluate((node) =>
          (node as HTMLElement).style.getPropertyValue('--ui-scroll-region-overflow-y-end'),
        ),
      ).toBe(`${scrollHeight - clientHeight - 30}px`);
      await viewport.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(root).not.toHaveAttribute('data-overflow-y-end');
    }
  });

  test('UIC-SCROLL-REGION-4.1 shades each edge the content reaches past, up to 8px', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const root = page.locator('[data-lab-edges="native"]');
    const viewport = root.locator('.ui-scroll-region__viewport');
    // The four shades' sizes, top, bottom, left and right: block axis heights, inline axis widths.
    const shades = () =>
      root.evaluate((node) =>
        getComputedStyle(node, '::before')
          .backgroundSize.split(', ')
          .map((size, index) => size.split(' ')[index < 2 ? 1 : 0]),
      );
    await expect.poll(shades).toEqual(['0px', '8px', '0px', '0px']);
    await viewport.evaluate((node) => {
      node.scrollTop = 5;
    });
    await expect.poll(shades).toEqual(['5px', '8px', '0px', '0px']);
    await viewport.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect.poll(shades).toEqual(['8px', '0px', '0px', '0px']);
  });

  test('UIC-SCROLL-REGION-4.3 UIC-SCROLL-REGION-4.4 follows new lines at the bottom and counts the edges', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const viewport = page.getByRole('log', { name: 'Arrivals' });
    const atBottom = async () => {
      const { scrollTop, scrollHeight, clientHeight } = await metrics(viewport);
      return scrollHeight - clientHeight - scrollTop <= 1;
    };
    await expect.poll(atBottom).toBe(true);
    const add = page.getByRole('button', { name: 'Add arrival' });
    await add.click();
    await add.click();
    await expect.poll(atBottom).toBe(true);
    await expect(page.locator('[data-lab-output="bottom"]')).toHaveText('0');

    await viewport.evaluate((node) => {
      node.scrollTop = 0;
    });
    await expect(page.locator('[data-lab-output="top"]')).toHaveText('1');
    await add.click();
    await expect(viewport.locator('li')).toHaveCount(11);
    expect(await atBottom()).toBe(false);
    await viewport.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(page.locator('[data-lab-output="bottom"]')).toHaveText('1');
    await add.click();
    await expect.poll(atBottom).toBe(true);
  });

  test('UIC-SCROLL-REGION-2.7 UIC-SCROLL-REGION-4.4 follows nested content that resizes no child', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const viewport = page.getByRole('log', { name: 'Sorting' });
    const thumb = page.locator(
      '[data-lab-region="nested-log"] .ui-scroll-region__thumb[data-orientation="vertical"]',
    );
    const range = async () => {
      const { scrollHeight, clientHeight } = await metrics(viewport);
      return String(scrollHeight - clientHeight);
    };
    const atBottom = async () => {
      const { scrollTop, scrollHeight, clientHeight } = await metrics(viewport);
      return scrollHeight - clientHeight - scrollTop <= 1;
    };
    await viewport.scrollIntoViewIfNeeded();
    await expect.poll(atBottom).toBe(true);
    const before = await range();
    await expect(thumb).toHaveAttribute('aria-valuemax', before);

    await page.getByRole('button', { name: 'Add lines' }).click();
    await expect.poll(range).not.toBe(before);
    await expect.poll(atBottom).toBe(true);
    await expect(thumb).toHaveAttribute('aria-valuemax', await range());

    await page.getByRole('button', { name: 'Space lines' }).click();
    await expect.poll(atBottom).toBe(true);
    await expect(thumb).toHaveAttribute('aria-valuemax', await range());

    await viewport.evaluate((node) => {
      node.scrollTop = 0;
    });
    await page.getByRole('button', { name: 'Add lines' }).click();
    await expect(thumb).toHaveAttribute('aria-valuemax', await range());
    expect((await metrics(viewport)).scrollTop).toBe(0);
    await page.getByRole('button', { name: 'Remove lines' }).click();
    await expect(thumb).toHaveAttribute('aria-valuemax', await range());
    expect((await metrics(viewport)).scrollTop).toBe(0);
  });

  test('UIC-SCROLL-REGION-4.5 marks the chapter at the top of the scrolled text', async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const toc = page.getByRole('navigation', { name: 'Chapters' });
    await expect(toc.locator('[aria-current="location"]')).toHaveText('Orchards');
    const viewport = page.getByRole('region', { name: 'Chapters text' });
    await viewport.evaluate((node) => {
      const target = node.querySelector('#chapter-meadows');
      if (!target) throw new Error('No Meadows chapter.');
      node.scrollTop += target.getBoundingClientRect().top - node.getBoundingClientRect().top;
    });
    await expect(toc.locator('[aria-current="location"]')).toHaveText('Meadows');
    await viewport.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
    });
    await expect(toc.locator('[aria-current="location"]')).toHaveText('Forests');
    await expect(toc.locator('[aria-current]')).toHaveCount(1);
  });
});

test('UIC-SCROLL-REGION-4.5 reads the current section on demand', async ({ page, lab }) => {
  await lab.open('scroll-region');
  const read = page.getByRole('button', { name: 'Read the current section' });
  await read.click();
  await expect(page.locator('[data-lab-output="resolved-section"]')).toHaveText(/^chapter-/);
});

for (const scale of [1.5, 0.5]) {
  test(`UIC-SCROLL-REGION-2.4 keeps a dragged thumb under the pointer inside scale(${scale})`, async ({
    page,
    lab,
  }) => {
    await lab.open('scroll-region');
    const region = page.locator('[data-lab-region="overlay"]');
    await region.evaluate((node, factor) => {
      Object.assign(node.style, { transform: `scale(${factor})`, transformOrigin: '0 0' });
    }, scale);
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
    await page.mouse.move(x, start.y + 4 + travel / 2, { steps: 5 });
    await page.mouse.up();
    const { scrollTop, scrollHeight, clientHeight } = await metrics(viewport);
    expect(Math.abs(scrollTop - (scrollHeight - clientHeight) / 2)).toBeLessThan(3);
    const moved = await box(thumb);
    expect(Math.abs(moved.y - (start.y + travel / 2))).toBeLessThanOrEqual(1.5);
  });
}
