import type { Page } from '@playwright/test';
import { expect, test, matrixCell } from './fixtures.js';

const cell = (page: Page, id: string) => matrixCell(page, id).locator(`.ui-outline`);

test.describe('Outline lab', () => {
  test('UIC-OUTLINE-1.1 UIC-OUTLINE-1.3 UIC-OUTLINE-1.4 UIC-OUTLINE-2.1 renders every state', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const plain = cell(page, 'numbering=plain state=current');
    await expect(plain).toHaveRole('navigation');
    await expect(plain.getByRole('link')).toHaveText([
      'Apples',
      'Sweet apples',
      'Tart apples',
      'Pears',
      'Autumn pears',
    ]);
    await expect(plain.getByRole('link', { name: 'Tart apples' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    const numbered = cell(page, 'numbering=numbered state=current');
    await expect(numbered.getByRole('link', { name: '1.2 Tart apples' })).toBeVisible();
    await expect(numbered.getByRole('link', { name: '2.1 Autumn pears' })).toBeVisible();

    const collapsed = cell(page, 'numbering=plain state=collapsed below 2');
    await expect(collapsed.getByRole('link')).toHaveText(['Apples', 'Pears']);
    await expect(collapsed.locator('.ui-outline__item').first()).toHaveAttribute(
      'data-current-within',
      'true',
    );
    await expect(cell(page, 'numbering=plain state=loading').getByRole('status')).toHaveText(
      'Loading',
    );
    await expect(cell(page, 'numbering=plain state=empty')).toHaveText('No headings yet.');
  });

  test('UIC-OUTLINE-2.2 UIC-OUTLINE-3.1 follows the scroll and jumps to headings', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const demo = page.locator('[data-lab-demo="reader"]');
    const outline = demo.getByRole('navigation', { name: 'Guide' });
    const current = outline.locator('[aria-current="location"]');
    await expect(current).toHaveText('1 Welcome');

    await outline.getByRole('link', { name: '3.3.1 Viewpoints' }).click();
    await expect(demo.locator('#guide-viewpoints')).toBeFocused();
    await expect(demo.locator('[data-lab-followed]')).toHaveText('guide-viewpoints');
    await expect(current).toHaveText('3.3.1 Viewpoints');
    expect(page.url()).not.toContain('#guide-viewpoints');

    const viewport = demo.getByRole('region', { name: 'Guide text' });
    await viewport.evaluate((element) => element.scrollTo({ top: 0 }));
    await expect(current).toHaveText('1 Welcome');

    await outline.getByRole('link', { name: '2.2 By air' }).focus();
    await page.keyboard.press('Enter');
    await expect(demo.locator('#guide-air')).toBeFocused();
    await expect(current).toHaveText('2.2 By air');
    const offset = await demo
      .locator('#guide-air')
      .evaluate(
        (heading) =>
          heading.getBoundingClientRect().top -
          (heading.closest('[role="region"]') as HTMLElement).getBoundingClientRect().top,
      );
    expect(Math.round(offset)).toBe(40);
  });

  test('UIC-OUTLINE-2.2 UIC-OUTLINE-3.1 follows and jumps to headings inside a shadow root', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const demo = page.locator('[data-lab-demo="shadow-reader"]');
    const outline = demo.getByRole('navigation', { name: 'Embedded guide' });
    const current = outline.locator('[aria-current="location"]');
    await expect(current).toHaveText('1 Welcome');
    await outline.getByRole('link', { name: '3.3.1 Viewpoints' }).click();
    await expect(demo.locator('#guide-viewpoints')).toBeFocused();
    await expect(current).toHaveText('3.3.1 Viewpoints');
    const outer = page.locator('[data-lab-demo="reader"]');
    await expect(outer.getByRole('region', { name: 'Guide text' })).toHaveJSProperty(
      'scrollTop',
      0,
    );
  });

  test('UIC-OUTLINE-3.1 scrolls only the guide, never the page or an outer scroller', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const panel = page.locator('[data-lab-panel]');
    for (const [demo, name, scale] of [
      ['reader', 'Guide', 1],
      ['shadow-reader', 'Embedded guide', 1],
      ['scaled-reader', 'Scaled guide', 0.8],
    ] as const) {
      const reader = page.locator(`[data-lab-demo="${demo}"]`);
      const region = reader.getByRole('region', { name: `${name} text` });
      await region.evaluate((element) => element.scrollTo({ top: 0 }));
      // The guide's text runs below the window's bottom edge, where scrollIntoView would scroll the page.
      await reader.evaluate((element) => {
        const box = element.getBoundingClientRect();
        window.scrollBy(0, box.top - window.innerHeight + 120);
      });
      await panel.evaluate((element) => element.scrollTo({ top: 20 }));
      const before = await page.evaluate(() => window.scrollY);
      const panelBefore = await panel.evaluate((element) => element.scrollTop);
      for (const [entry, id, how] of [
        ['3.3.1 Viewpoints', 'guide-viewpoints', 'pointer'],
        ['2.2 By air', 'guide-air', 'keyboard'],
      ] as const) {
        const link = reader.getByRole('navigation', { name }).getByRole('link', { name: entry });
        if (how === 'pointer') await link.evaluate((element: HTMLElement) => element.click());
        else {
          await link.evaluate((element: HTMLElement) => element.focus({ preventScroll: true }));
          await page.keyboard.press('Enter');
        }
        const heading = reader.locator(`#${id}`);
        await expect(heading).toBeFocused();
        const offset = await heading.evaluate(
          (node) =>
            node.getBoundingClientRect().top -
            (node.closest('[role="region"]') as HTMLElement).getBoundingClientRect().top,
        );
        // Below the 40px sticky header, drawn at the guide's scale.
        expect(Math.round(offset)).toBe(Math.round(40 * scale));
        expect(await page.evaluate(() => window.scrollY)).toBe(before);
        expect(await panel.evaluate((element) => element.scrollTop)).toBe(panelBefore);
        await expect(
          reader.getByRole('navigation', { name }).locator('[aria-current="location"]'),
        ).toHaveText(entry);
      }
    }
  });

  test('UIC-OUTLINE-4.1 UIC-OUTLINE-4.2 UIC-OUTLINE-5.1 collapses sections from the keyboard and the caller', async ({
    page,
    lab,
  }) => {
    await lab.open('outline');
    const demo = page.locator('[data-lab-demo="controlled"]');
    const outline = demo.getByRole('navigation', { name: 'Guide sections' });
    const districts = outline.getByRole('button', { name: 'Sections in Districts' });
    await expect(districts).toHaveAttribute('aria-expanded', 'true');
    await expect(outline.getByRole('link', { name: 'III.c Hills' })).toBeVisible();
    await expect(outline.getByRole('link', { name: 'III.c.1 Viewpoints' })).toBeHidden();

    await districts.focus();
    await page.keyboard.press('Tab');
    await expect(outline.getByRole('link', { name: 'III Districts' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(outline.getByRole('link', { name: 'III.a Old town' })).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(districts).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(districts).toHaveAttribute('aria-expanded', 'false');
    await expect(outline.getByRole('link', { name: 'III.a Old town' })).toBeHidden();
    await expect(demo.locator('[data-lab-expanded]')).toHaveText('none');
    await expect(outline.locator('.ui-outline__item[data-current-within]').first()).toContainText(
      'Districts',
    );

    await demo.getByRole('button', { name: 'Expand all' }).click();
    await expect(outline.getByRole('link', { name: 'III.c.1 Viewpoints' })).toBeVisible();
    await expect(outline.locator('[aria-current="location"]')).toHaveText('III.c.1 Viewpoints');
    await outline.getByRole('button', { name: 'Sections in Food' }).press('Space');
    await expect(demo.locator('[data-lab-expanded]')).toHaveText(
      'guide-arriving, guide-districts, guide-hills',
    );
    await demo.getByRole('button', { name: 'Collapse all' }).click();
    await expect(outline.getByRole('link')).toHaveText([
      'I Welcome',
      'II Arriving',
      'III Districts',
      'IV Food',
      'V Practical notes',
    ]);
  });

  test('UIC-OUTLINE-5.1 passes axe', async ({ page, lab }) => {
    await lab.open('outline');
    await expect(page.locator('#lab-root .ui-outline').first()).toBeVisible();
    await lab.expectAccessible();
  });
});

test('UIC-OUTLINE-4.2 forgets a toggle once its heading leaves the outline', async ({
  page,
  lab,
}) => {
  await lab.open('outline');
  const demo = page.locator('[data-lab-returning]');
  const pears = demo.getByRole('button', { name: 'Sections in Pears' });
  await expect(pears).toHaveAttribute('aria-expanded', 'false');
  await pears.click();
  await expect(pears).toHaveAttribute('aria-expanded', 'true');
  await demo.getByRole('button', { name: 'Remove Pears' }).click();
  await expect(pears).toHaveCount(0);
  await demo.getByRole('button', { name: 'Bring Pears back' }).click();
  await expect(pears).toHaveAttribute('aria-expanded', 'false');
});
