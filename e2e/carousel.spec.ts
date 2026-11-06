import { expect, test } from './fixtures.js';

test.describe('Carousel lab', () => {
  test('UIC-CAROUSEL-1.2 starts an uncontrolled carousel at its default index', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const demo = page.locator('[data-lab-demo="default-index"]');
    const carousel = demo.getByRole('region', { name: 'Cities from a chosen start' });
    const current = carousel.locator('.ui-carousel__slide[data-current]');
    const moves = demo.locator('[data-lab-output="moves"]');
    await expect(current).toHaveAccessibleName('3 of 4');
    await expect(current).toContainText('Kyoto');
    await expect(moves).toHaveText('none');
    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await expect(current).toContainText('Quito');
    await carousel.getByRole('button', { name: 'Previous slide' }).click();
    await expect(moves).toHaveText('Quito, Kyoto');
    await demo.getByRole('radio', { name: 'Oslo' }).click();
    await expect(current).toHaveAccessibleName('2 of 4');
    await expect(moves).toHaveText('none');
    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await demo.getByRole('button', { name: 'Start over' }).click();
    await expect(current).toContainText('Oslo');
    await expect(moves).toHaveText('none');
  });

  test('UIC-CAROUSEL-1.1 UIC-CAROUSEL-1.2 UIC-CAROUSEL-4.1 shows one named slide and moves with the buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.getByRole('region', { name: 'Cities, dots, no loop' });
    await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    const current = carousel.locator('.ui-carousel__slide[data-current]');
    await expect(current).toHaveAccessibleName('1 of 4');
    await expect(current).toHaveAttribute('aria-roledescription', 'slide');
    await expect(carousel.locator('.ui-carousel__slide:visible')).toHaveCount(1);
    await expect(current.getByRole('img')).toHaveAccessibleName('Lisbon skyline');
    const previous = carousel.getByRole('button', { name: 'Previous slide' });
    const next = carousel.getByRole('button', { name: 'Next slide' });
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await next.click();
    await expect(current).toHaveAccessibleName('2 of 4');
    await expect(current).toContainText('Oslo');
    await expect(carousel.locator('.ui-carousel__viewport')).toHaveAttribute('aria-live', 'polite');
    const looping = page.getByRole('region', { name: 'Cities, dots, loop' });
    await looping.getByRole('button', { name: 'Previous slide' }).click();
    await expect(looping.locator('.ui-carousel__slide[data-current]')).toContainText('Quito');
  });

  test('UIC-CAROUSEL-1.1 keeps every page the same size while moving through them', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.getByRole('region', { name: 'Cities, thumbnails, loop' });
    const next = carousel.getByRole('button', { name: 'Next slide' });
    const parts = [
      carousel.locator('.ui-carousel__viewport'),
      next,
      carousel.locator('.ui-carousel__pagination'),
    ];
    const bounds = async () => {
      const origin = await carousel.boundingBox();
      if (!origin) throw new Error('The carousel has no bounds.');
      return Promise.all(
        parts.map(async (part) => {
          const box = await part.boundingBox();
          return box ? { ...box, x: box.x - origin.x, y: box.y - origin.y } : null;
        }),
      );
    };
    for (const width of [1280, 360]) {
      await page.setViewportSize({ width, height: 800 });
      await carousel.scrollIntoViewIfNeeded();
      const first = await bounds();
      for (const name of ['Oslo', 'Kyoto', 'Quito', 'Lisbon']) {
        await next.click();
        const current = carousel.locator('.ui-carousel__slide[data-current]');
        await expect(current).toContainText(name);
        // The picture has loaded, and the long caption is shown whole.
        await expect(current.getByRole('img')).toHaveJSProperty('complete', true);
        expect(await current.evaluate((slide) => slide.scrollHeight <= slide.clientHeight)).toBe(
          true,
        );
        // Clicking can scroll the page; each part keeps its geometry within the carousel.
        expect(await bounds()).toEqual(first);
      }
    }
    await expect(carousel.locator('.ui-carousel__slide:visible')).toHaveCount(1);
  });

  test('UIC-CAROUSEL-1.3 picks slides from dots and thumbnails', async ({ page, lab }) => {
    await lab.open('carousel');
    const dots = page.getByRole('region', { name: 'Cities, dots, no loop' });
    const dot = dots.getByRole('button', { name: 'Slide 3' });
    expect((await dot.boundingBox())?.width).toBe(10);
    await dot.click();
    await expect(dot).toHaveAttribute('aria-current', 'true');
    await expect(dots.locator('.ui-carousel__slide[data-current]')).toContainText('Kyoto');
    const thumbnails = page.getByRole('region', { name: 'Cities, thumbnails, no loop' });
    await thumbnails.getByRole('button', { name: 'Slide 4' }).click();
    await expect(thumbnails.locator('.ui-carousel__slide[data-current]')).toContainText('Quito');
    await expect(thumbnails.locator('.ui-carousel__thumbnail img').first()).toHaveAttribute(
      'alt',
      '',
    );
    await expect(
      page
        .getByRole('region', { name: 'Cities, none, no loop' })
        .locator('.ui-carousel__pagination'),
    ).toHaveCount(0);
  });

  test('UIC-CAROUSEL-2.1 UIC-CAROUSEL-2.2 moves with the arrow keys and keeps focus on a slide', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="controlled"]');
    const output = page.locator('[data-lab-output="index"]');
    await expect(output).toHaveText('Kyoto');
    await carousel.getByRole('button', { name: 'Next slide' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(output).toHaveText('Quito');
    await page.keyboard.press('ArrowRight');
    await expect(output).toHaveText('Lisbon');
    await carousel.locator('.ui-carousel__slide[data-current]').getByRole('link').focus();
    await page.keyboard.press('ArrowLeft');
    await expect(output).toHaveText('Quito');
    const current = carousel.locator('.ui-carousel__slide[data-current]');
    await expect(current).toBeFocused();
    await expect(current).toHaveAccessibleName('4 of 4');
  });

  test('UIC-CAROUSEL-2.2 keeps focus when the page moves or removes the focused slide', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('carousel');
    const demo = page.locator('[data-lab-demo="host-changes"]');
    const current = demo.locator('.ui-carousel__slide[data-current]');
    await demo.getByRole('button', { name: 'Show the next city in one second' }).click();
    await current.getByRole('link', { name: 'More' }).focus();
    await page.clock.runFor(1000);
    await expect(current).toHaveAccessibleName('2 of 4');
    await expect(current).toBeFocused();
    await demo.getByRole('button', { name: 'Remove the shown city in one second' }).click();
    await current.getByRole('link', { name: 'More' }).focus();
    await page.clock.runFor(1000);
    await expect(current).toHaveAccessibleName('2 of 3');
    await expect(current).toContainText('Kyoto');
    await expect(current).toBeFocused();
  });

  test('UIC-CAROUSEL-3.1 UIC-CAROUSEL-3.2 UIC-CAROUSEL-3.3 rotates, pauses on hover and stops', async ({
    page,
    lab,
  }) => {
    await page.clock.install();
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="autoplay"]');
    const current = carousel.locator('.ui-carousel__slide[data-current]');
    await expect(carousel).toHaveAttribute('data-rotating', 'true');
    await expect(carousel.locator('.ui-carousel__viewport')).toHaveAttribute('aria-live', 'off');
    await page.clock.runFor(3000);
    await expect(current).toContainText('Oslo');
    await carousel.hover();
    await expect(carousel).not.toHaveAttribute('data-rotating');
    await page.clock.runFor(9000);
    await expect(current).toContainText('Oslo');
    await page.mouse.move(1, 1);
    await expect(carousel).toHaveAttribute('data-rotating', 'true');
    await page.clock.runFor(3000);
    await expect(current).toContainText('Kyoto');
    const stop = carousel.getByRole('button', { name: 'Stop automatic slide show' });
    await stop.focus();
    await page.keyboard.press('Enter');
    const start = carousel.getByRole('button', { name: 'Start automatic slide show' });
    await expect(start).toBeFocused();
    await page.clock.runFor(9000);
    await expect(current).toContainText('Kyoto');
    await page.keyboard.press('Enter');
    await expect(carousel).toHaveAttribute('data-rotating', 'true');
    await page.clock.runFor(3000);
    await expect(current).toContainText('Quito');
  });

  test('UIC-CAROUSEL-3.4 starts stopped for reduced motion and passes axe', async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="autoplay"]');
    await expect(
      carousel.getByRole('button', { name: 'Start automatic slide show' }),
    ).toBeVisible();
    await expect(carousel).not.toHaveAttribute('data-rotating');
    await expect(page.locator('[data-lab-carousel="single"] .ui-carousel__controls')).toHaveCount(
      0,
    );
    await lab.expectAccessible();
  });

  test('UIC-CAROUSEL-3.4 follows a reduced-motion setting changed while the page is open', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="autoplay"]');
    await expect(carousel).toHaveAttribute('data-rotating', 'true');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(
      carousel.getByRole('button', { name: 'Start automatic slide show' }),
    ).toBeVisible();
    await expect(carousel).not.toHaveAttribute('data-rotating');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(carousel).toHaveAttribute('data-rotating', 'true');
  });

  test('UIC-CAROUSEL-1.5 lays three cards side by side and moves two, ending on a full page', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="cards"]');
    const shown = carousel.locator('.ui-carousel__slide[data-current]');
    await expect(shown).toHaveCount(3);
    const boxes = await shown.evaluateAll((slides) =>
      slides.map((slide) => slide.getBoundingClientRect().toJSON() as DOMRect),
    );
    const [first, second, third] = boxes;
    if (!first || !second || !third) throw new Error('cards not laid out');
    expect(second.left).toBeGreaterThan(first.right - 2);
    expect(third.left).toBeGreaterThan(second.right - 2);
    expect(Math.round(first.height)).toBe(Math.round(third.height));
    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await expect(page.locator('[data-lab-output="first-card"]')).toHaveText('Fir');
    await expect(shown).toHaveText([/Fir/, /Hazel/, /Larch/]);
    await expect(carousel.getByRole('button', { name: 'Next slide' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(carousel.getByRole('button', { name: 'Slide 5' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await shown.nth(1).getByRole('link', { name: 'Open' }).focus();
    await page.getByRole('radio', { name: 'One a page' }).click();
    await expect(shown).toHaveCount(1);
    await expect(shown).toContainText('Fir');
    await lab.expectAccessible('[data-lab-carousel="cards"]');
  });

  test('UIC-CAROUSEL-2.3 swipes with a mouse and a finger, leaving vertical drags to the page', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="cards"]');
    const viewport = carousel.locator('.ui-carousel__viewport');
    await viewport.scrollIntoViewIfNeeded();
    await expect(viewport).toHaveCSS('touch-action', 'pan-y pinch-zoom');
    const box = await viewport.boundingBox();
    if (!box) throw new Error('viewport not rendered');
    const y = box.y + box.height / 2;
    const output = page.locator('[data-lab-output="first-card"]');
    await page.mouse.move(box.x + box.width - 20, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 60, y, { steps: 4 });
    await expect(viewport).toHaveAttribute('data-swiping', 'true');
    await page.mouse.move(box.x + 40, y, { steps: 6 });
    await page.mouse.up();
    await expect(output).toHaveText('Cedar');
    await expect(viewport).not.toHaveAttribute('data-swiping');
    await page.mouse.move(box.x + 40, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 50, y + 80, { steps: 6 });
    await page.mouse.up();
    await expect(output).toHaveText('Cedar');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number) =>
      cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x, y }],
      });
    await touch('touchStart', box.x + 60);
    await touch('touchMove', box.x + 90);
    await touch('touchMove', box.x + 160);
    await touch('touchEnd', box.x + 160);
    await expect(output).toHaveText('Alder');
  });

  test('UIC-CAROUSEL-1.6 mounts a slide once shown and keeps what it holds', async ({
    page,
    lab,
  }) => {
    await lab.open('carousel');
    const carousel = page.locator('[data-lab-carousel="deferred"]');
    const mounted = page.locator('[data-lab-output="mounted"]');
    await expect(mounted).toHaveText('Lisbon');
    await expect(carousel.locator('.ui-carousel__slide').nth(1)).toBeEmpty();
    await carousel.getByRole('textbox', { name: 'Note about Lisbon' }).fill('Trams');
    await carousel.getByRole('button', { name: 'Next slide' }).click();
    await expect(mounted).toHaveText('Lisbon, Oslo');
    await carousel.getByRole('button', { name: 'Previous slide' }).click();
    await expect(carousel.getByRole('textbox', { name: 'Note about Lisbon' })).toHaveValue('Trams');
    await expect(mounted).toHaveText('Lisbon, Oslo');
    await lab.expectAccessible('[data-lab-carousel="deferred"]');
  });
});
