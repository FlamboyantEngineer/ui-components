import { expect, test } from './fixtures.js';

for (const theme of ['light', 'dark']) {
  for (const direction of ['ltr', 'rtl']) {
    for (const width of [720, 420]) {
      test(`UIC-CHAT-3.4 aligns fixed-size queue handles and text with a compact inset at ${width}px in ${direction} ${theme}`, async ({
        page,
        lab,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        await lab.open('chat', { theme });
        const demo = page.locator('[data-lab-demo="native-chat"]');
        await demo.evaluate((element, dir) => element.setAttribute('dir', dir), direction);
        await demo.scrollIntoViewIfNeeded();
        const queue = demo.locator('.ui-chat__queue');
        const handles = demo.locator('.ui-chat__queue-handle');
        const texts = demo.locator('.ui-chat__queue-text');
        await expect(handles).toHaveCount(2);
        await expect(async () => {
          const frame = await queue.boundingBox();
          const first = await handles.nth(0).boundingBox();
          const second = await handles.nth(1).boundingBox();
          const firstText = await texts.nth(0).boundingBox();
          const secondText = await texts.nth(1).boundingBox();
          if (!frame || !first || !second || !firstText || !secondText)
            throw new Error('Queue rows must have measurable controls and text');
          expect(first.width).toBeCloseTo(first.height);
          expect(second.width).toBeCloseTo(first.width);
          expect(second.height).toBeCloseTo(first.height);
          expect(second.x).toBeCloseTo(first.x);
          const start = (box: { x: number; width: number }) =>
            direction === 'rtl' ? box.x + box.width : box.x;
          expect(start(secondText)).toBeCloseTo(start(firstText));
          expect(Math.abs(start(first) - start(frame))).toBeCloseTo(5);
          expect(
            await texts.nth(0).evaluate((element) => element.scrollWidth > element.clientWidth),
          ).toBe(true);
        }).toPass();
      });
    }
  }
}

for (const width of [720, 360]) {
  test(`UIC-CHAT-3.4 sits the queue on the composer's top edge, a little narrower, at ${width}px`, async ({
    page,
    lab,
  }) => {
    await lab.open('chat');
    const demo = page.locator(
      `[data-lab-demo="${width === 720 ? 'look-running' : 'look-narrow'}"]`,
    );
    await demo.scrollIntoViewIfNeeded();
    const queue = demo.locator('.ui-chat__queue');
    const composer = demo.locator('.ui-chat__composer');
    await expect(demo.locator('.ui-chat__queue-text')).toHaveCount(3);
    const frame = await queue.boundingBox();
    const box = await composer.boundingBox();
    if (!frame || !box) throw new Error('The queue and the composer must be measurable');
    // Inset from the composer on both sides, by the same few pixels.
    const startInset = frame.x - box.x;
    const endInset = box.x + box.width - (frame.x + frame.width);
    expect(startInset).toBeGreaterThan(4);
    expect(startInset).toBeLessThan(24);
    expect(endInset).toBeCloseTo(startInset, 0);
    // Flush on the composer's top edge, the composer's border showing under it.
    expect(Math.abs(frame.y + frame.height - box.y)).toBeLessThanOrEqual(1);
    const corners = await queue.evaluate((element) => {
      const style = getComputedStyle(element);
      return [
        style.borderStartStartRadius,
        style.borderStartEndRadius,
        style.borderEndStartRadius,
        style.borderEndEndRadius,
      ];
    });
    expect(corners[0]).not.toBe('0px');
    expect(corners[1]).not.toBe('0px');
    expect(corners.slice(2)).toEqual(['0px', '0px']);
  });
}
