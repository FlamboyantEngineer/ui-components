import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures.js';

async function pauseSequence(drawing: Locator) {
  return drawing.evaluate((node) => {
    const animations = node.getAnimations({ subtree: true });
    animations.forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
    return animations.map((animation) => {
      const timing = animation.effect!.getComputedTiming();
      return {
        duration: Number(timing.duration),
        delay: timing.delay,
        iterations: timing.iterations,
      };
    });
  });
}

async function fillAt(drawing: Locator, time: number) {
  return drawing.evaluate((node, elapsed) => {
    node.getAnimations({ subtree: true }).forEach((animation) => {
      animation.currentTime = elapsed;
    });
    return [...node.querySelectorAll('.ui-segmented-bar__segment')].map((segment) => {
      const style = getComputedStyle(segment);
      return segment.tagName.toLowerCase() === 'circle'
        ? Number.parseFloat(style.strokeDasharray)
        : new DOMMatrixReadOnly(style.transform).a;
    });
  }, time);
}

async function finishSequence(drawing: Locator) {
  await drawing.evaluate((node) =>
    node.getAnimations({ subtree: true }).forEach((animation) => animation.finish()),
  );
  await expect(drawing).toHaveAttribute('data-animation-state', 'complete');
}

for (const shape of ['linear', 'donut', 'pie']) {
  test(`UIC-SEGMENTED-BAR-4.1 UIC-SEGMENTED-BAR-4.2 ${shape} fills once in proportional sequence and can replay`, async ({
    page,
    lab,
  }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await lab.open('segmented-bar');
    const demo = page.locator(`[data-lab-animation="${shape}-animated"]`);
    const drawing = demo.locator('[data-animation-state]');
    await expect(drawing).toHaveAttribute('data-animation-state', 'waiting');
    await drawing.scrollIntoViewIfNeeded();
    await expect(drawing).toHaveAttribute('data-animation-state', 'running');
    const timing = await pauseSequence(drawing);
    expect(timing.map((part) => Math.round(part.duration))).toEqual([840, 120, 80, 160]);
    expect(timing.map((part) => Math.round(part.delay ?? 0))).toEqual([0, 840, 960, 1040]);
    expect(timing.map((part) => part.iterations)).toEqual([1, 1, 1, 1]);
    const halfFirst = await fillAt(drawing, 420);
    expect(halfFirst[0]).toBeCloseTo(shape === 'linear' ? 0.5 : 26.25, 2);
    expect(halfFirst.slice(1)).toEqual([0, 0, 0]);
    const halfSecond = await fillAt(drawing, 900);
    expect(halfSecond[0]).toBeCloseTo(shape === 'linear' ? 1 : 52.5, 2);
    expect(halfSecond[1]).toBeCloseTo(shape === 'linear' ? 0.5 : 3.75, 2);
    expect(halfSecond.slice(2)).toEqual([0, 0]);
    await expect(demo.getByRole('listitem')).toHaveText([
      /Passed\s*42\s*52\.5%/,
      /Failed\s*6\s*7\.5%/,
      /Blocked\s*4\s*5%/,
      /Skipped\s*8\s*10%/,
    ]);
    await expect(demo.locator('.ui-segmented-bar__total')).toHaveText('80 total');
    await finishSequence(drawing);
    await page.evaluate(() => window.scrollTo(0, 0));
    await drawing.scrollIntoViewIfNeeded();
    await expect(drawing).toHaveAttribute('data-animation-state', 'complete');
    expect(await drawing.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
    const replay = demo.getByRole('button', { name: `Replay ${shape} animation` });
    await replay.click();
    await expect(replay).toBeFocused();
    await expect(drawing).toHaveAttribute('data-animation-state', 'running');
    await finishSequence(drawing);
  });
}

test('UIC-SEGMENTED-BAR-4.1 UIC-SEGMENTED-BAR-4.2 reduced motion shows every shape immediately, including replay', async ({
  page,
  lab,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await lab.open('segmented-bar');
  for (const shape of ['linear', 'donut', 'pie']) {
    const demo = page.locator(`[data-lab-animation="${shape}-animated"]`);
    const drawing = demo.locator('[data-animation-state]');
    await drawing.scrollIntoViewIfNeeded();
    await expect(drawing).toHaveAttribute('data-animation-state', 'complete');
    await expect(demo.locator('.ui-segmented-bar__segment').first()).toHaveCSS(
      'visibility',
      'visible',
    );
    await expect(demo.locator('.ui-segmented-bar__segment').first()).toHaveCSS(
      'transition-duration',
      '0s',
    );
    expect(await drawing.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
    await demo.getByRole('button', { name: `Replay ${shape} animation` }).click();
    await expect(drawing).toHaveAttribute('data-animation-state', 'complete');
    expect(await drawing.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  }
});
