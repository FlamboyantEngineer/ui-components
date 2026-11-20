import { expect, test } from './fixtures.js';

test('UIC-MARKER-1.1 rules a separator on both sides and a border beneath', async ({
  page,
  lab,
}) => {
  await lab.open('marker');
  const separator = page.getByRole('group', { name: 'separator text marker' });
  const rules = await separator.evaluate((marker) => [
    getComputedStyle(marker, '::before').height,
    getComputedStyle(marker, '::after').height,
  ]);
  expect(rules).toEqual(['1px', '1px']);
  const content = await separator.locator('.ui-marker__content').boundingBox();
  const frame = await separator.boundingBox();
  if (!content || !frame) throw new Error('Expected a laid-out marker');
  expect(Math.abs(content.x + content.width / 2 - (frame.x + frame.width / 2))).toBeLessThan(2);
  const border = page.getByRole('group', { name: 'border text marker' });
  expect(await border.evaluate((marker) => getComputedStyle(marker).borderBottomWidth)).toBe('1px');
  const plain = page.getByRole('group', { name: 'default icon and link marker' });
  await expect(plain.getByRole('link', { name: 'Reply stopped' })).toBeVisible();
  await lab.expectAccessible();
});
