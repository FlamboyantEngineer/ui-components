import { expect, test } from './fixtures.js';

const variants = ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'];

test('UIC-BUBBLE-1.1 lays out all surfaces at the requested start and end edges', async ({
  page,
  lab,
}) => {
  await lab.open('bubble');
  for (const variant of variants) {
    const start = page.getByRole('group', { name: `start ${variant} bubble` });
    const end = page.getByRole('group', { name: `end ${variant} bubble` });
    await expect(start).toHaveAttribute('data-variant', variant);
    await expect(end).toHaveAttribute('data-align', 'end');
    const inlineOffset = (bubble: Element) =>
      bubble.getBoundingClientRect().x - (bubble.parentElement?.getBoundingClientRect().x ?? 0);
    expect(await start.evaluate(inlineOffset)).toBe(0);
    expect(await end.evaluate(inlineOffset)).toBeGreaterThan(0);
  }
  await lab.expectAccessible();
});

test('UIC-BUBBLE-1.2 overlaps reactions on the chosen edge without covering the text', async ({
  page,
  lab,
}) => {
  await lab.open('bubble');
  for (const side of ['bottom', 'top']) {
    for (const align of ['start', 'end']) {
      const group = page.getByRole('group', { name: `${side} ${align} reactions` });
      const reactions = group.locator('.ui-bubble__reactions');
      const bubble = group.locator('.ui-bubble').nth(1);
      const box = await reactions.boundingBox();
      const frame = await bubble.boundingBox();
      const text = await bubble.locator('.ui-bubble__content').boundingBox();
      if (!box || !frame || !text) throw new Error('Expected laid-out reactions');
      const edge = side === 'bottom' ? frame.y + frame.height : frame.y;
      expect(box.y).toBeLessThan(edge);
      expect(box.y + box.height).toBeGreaterThan(edge);
      if (side === 'bottom') expect(box.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
      else expect(box.y + box.height).toBeLessThanOrEqual(text.y + 1);
      const center = box.x + box.width / 2;
      const middle = frame.x + frame.width / 2;
      if (align === 'end') expect(center).toBeGreaterThan(middle);
      else expect(center).toBeLessThan(middle);
    }
  }
  await lab.expectAccessible();
});
