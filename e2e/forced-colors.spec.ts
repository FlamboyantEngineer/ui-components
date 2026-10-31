import { readdirSync } from 'node:fs';
import { expect, test } from './fixtures.js';

const labNames = readdirSync('labs')
  .filter((file) => file.endsWith('.html') && file !== 'index.html')
  .map((file) => file.slice(0, -'.html'.length))
  .sort();

/** Tab stops kept per lab: enough to reach the first controls of every matrix. */
const tabStops = 12;

/**
 * The focused element, unless it is outside the lab content or shows no visible outline on itself
 * or on an element between it and its nearest hook element.
 */
async function focusWithoutOutline(): Promise<string | null> {
  // Focus-visible state arrives with the next render.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const host = document.activeElement;
  if (!host || !document.querySelector('#lab-root')?.contains(host)) return null;
  let focused = host;
  while (focused.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement;
  for (let element: Element | null = focused; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0) return null;
    if (/(?:^|\s)ui-/.test(element.className)) break;
  }
  return `${focused.tagName.toLowerCase()}.${focused.className}`;
}

for (const name of labNames) {
  test(`UIC-LABS-3.10 ${name} keeps a visible focus ring in forced colours`, async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await lab.open(name);
    await page.locator('#lab-root').evaluate((root) => {
      root.tabIndex = -1;
      root.focus();
    });
    const missing = new Set<string>();
    for (let stop = 0; stop < tabStops; stop += 1) {
      await page.keyboard.press('Tab');
      const problem = await page.evaluate(focusWithoutOutline);
      if (problem) missing.add(problem);
    }
    expect([...missing]).toEqual([]);
  });
}
