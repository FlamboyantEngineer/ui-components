import { readdirSync } from 'node:fs';
import { expect, test } from './fixtures.js';

const labNames = readdirSync('labs')
  .filter((file) => file.endsWith('.html') && file !== 'index.html')
  .map((file) => file.slice(0, -'.html'.length))
  .sort();

/** Hook elements (and their pseudo-elements) that would still animate or transition over time. */
function movingHooks(): string[] {
  const moving = (durations: string) => durations.split(',').some((part) => part.trim() !== '0s');
  return [...document.body.querySelectorAll('[class^="ui-"], [class*=" ui-"]')].flatMap((element) =>
    [null, '::before', '::after'].flatMap((pseudo) => {
      const style = getComputedStyle(element, pseudo);
      const animates = style.animationName !== 'none' && moving(style.animationDuration);
      return animates || moving(style.transitionDuration)
        ? [`${element.className}${pseudo ?? ''}`]
        : [];
    }),
  );
}

test('UIC-LABS-3.9 the reference stylesheet animates without the preference', async ({
  page,
  lab,
}) => {
  await lab.open('button');
  expect(await page.evaluate(movingHooks)).not.toEqual([]);
});

for (const name of labNames) {
  test(`UIC-LABS-3.9 ${name} settles at once under reduced motion`, async ({ page, lab }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.open(name);
    expect(await page.evaluate(movingHooks)).toEqual([]);
  });
}
