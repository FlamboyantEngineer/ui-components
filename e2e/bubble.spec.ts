import { expect, test } from './fixtures.js';

test('UIC-BUBBLE-1.1 lays out all surfaces at the requested start and end edges', async ({
  page,
  lab,
}) => {
  await lab.open('bubble');
  for (const variant of ['default', 'muted', 'outline', 'ghost']) {
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
