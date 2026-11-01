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
      if (!animation.effect) throw new Error('An animation has no effect.');
      const timing = animation.effect.getComputedTiming();
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
    expect(timing.map((part) => Math.round(part.duration))).toEqual([600]);
    expect(timing.map((part) => Math.round(part.delay ?? 0))).toEqual([0]);
    expect(timing.map((part) => part.iterations)).toEqual([1]);
    // Shares are 52.5, 7.5, 5 and 10 (75 drawn): a segment's full drawing is its share (an arc's
    // dash) or 1.
    const full = [52.5, 7.5, 5, 10].map((share) => (shape === 'linear' ? 1 : share));
    expect(await fillAt(drawing, 0)).toEqual([0, 0, 0, 0]);
    // The sweep eases in: a quarter of the time draws far less than a quarter of the 75.
    const early = await fillAt(drawing, 150);
    expect(early[0]).toBeGreaterThan(0);
    expect(early[0]).toBeLessThan(((full[0] ?? 0) * 10) / 52.5);
    // Halfway through the time the symmetric ease has drawn half: 37.5 of the first segment's 52.5.
    const half = await fillAt(drawing, 300);
    expect(half[0]).toBeCloseTo(((full[0] ?? 0) * 37.5) / 52.5, 1);
    expect(half.slice(1)).toEqual([0, 0, 0]);
    // Later the first segment is whole and the second runs: the handover has no gap.
    const handover = await fillAt(drawing, 360);
    expect(handover[0]).toBeCloseTo(full[0] ?? 0, 2);
    expect(handover[1]).toBeGreaterThan(0);
    expect(await fillAt(drawing, 600)).toEqual(full.map((value) => expect.closeTo(value, 2)));
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
