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
