import { expect, test } from './fixtures.js';

test.describe('Carousel lab', () => {
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
    await lab.open('carousel', { theme: 'dark' });
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
});
