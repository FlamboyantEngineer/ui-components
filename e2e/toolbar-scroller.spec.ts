import type { Locator } from '@playwright/test';
import { cellSelector, expect, test } from './fixtures.js';

function cell(direction: string, buttons: string, position: string) {
  return cellSelector(`direction=${direction} buttons=${buttons} position=${position}`);
}

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error('element has no box');
  return result;
}

test.describe('Toolbar Scroller lab', () => {
  test('UIC-TOOLBAR-SCROLLER-1.1 UIC-TOOLBAR-SCROLLER-2.1 UIC-TOOLBAR-SCROLLER-2.2 UIC-TOOLBAR-SCROLLER-2.3 marks only the edges that hide tools', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const expectations = [
      ['fits', false, false],
      ['start', false, true],
      ['middle', true, true],
      ['end', true, false],
    ] as const;
    for (const direction of ['ltr', 'rtl']) {
      for (const [position, start, end] of expectations) {
        const root = page.locator(`${cell(direction, 'on', position)} .ui-toolbar-scroller`);
        for (const [edge, hidden] of [
          ['start', start],
          ['end', end],
        ] as const) {
          const attribute = `data-overflow-${edge}`;
          if (hidden) await expect(root).toHaveAttribute(attribute, 'true');
          else await expect(root).not.toHaveAttribute(attribute);
          const fade = root.locator(`.ui-toolbar-scroller__fade[data-edge="${edge}"]`);
          const button = root.getByRole('button', {
            name: edge === 'start' ? 'Scroll backward' : 'Scroll forward',
          });
          await expect(fade).toBeVisible({ visible: hidden });
          await expect(button).toBeVisible({ visible: hidden });
        }
      }
    }
    const off = page.locator(`${cell('ltr', 'off', 'middle')} .ui-toolbar-scroller`);
    await expect(off.locator('.ui-toolbar-scroller__scroll-button')).toHaveCount(0);
    await expect(off.locator('.ui-toolbar-scroller__fade[data-edge="end"]')).toBeVisible();

    const strip = page.locator(`${cell('ltr', 'on', 'start')} .ui-toolbar-scroller__strip`);
    const tools = strip.getByRole('button');
    for (const tool of await tools.all()) {
      expect(await tool.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
    expect(await strip.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  });

  test('UIC-TOOLBAR-SCROLLER-1.2 keeps the caret keys of a tool field until the caret reaches an end', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const tools = page.getByRole('toolbar', { name: 'Separate tool drafts' });
    const numeric = tools.getByRole('textbox', { name: 'Numeric tool' });
    await numeric.click();
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowLeft');
    await expect(numeric).toBeFocused();
    expect(await numeric.evaluate((field: HTMLInputElement) => field.selectionStart)).toBe(11);
    await page.keyboard.press('End');
    await page.keyboard.press('ArrowRight');
    await expect(tools.getByRole('textbox', { name: 'Text tool' })).toBeFocused();
  });

  test('UIC-TOOLBAR-SCROLLER-2.3 scroll buttons page toward their edge and mirror right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const root = page.locator(`${cell('ltr', 'on', 'start')} .ui-toolbar-scroller`);
    const strip = root.locator('.ui-toolbar-scroller__strip');
    await root.getByRole('button', { name: 'Scroll forward' }).click();
    await expect.poll(() => strip.evaluate((node) => node.scrollLeft)).toBeGreaterThan(100);
    await expect(root).toHaveAttribute('data-overflow-start', 'true');
    await root.getByRole('button', { name: 'Scroll backward' }).click();
    await expect.poll(() => strip.evaluate((node) => node.scrollLeft)).toBe(0);
    await expect(root.getByRole('button', { name: 'Scroll backward' })).toBeHidden();

    const rtl = page.locator(`${cell('rtl', 'on', 'start')} .ui-toolbar-scroller`);
    const rtlStrip = await box(rtl.locator('.ui-toolbar-scroller__strip'));
    const forward = await box(rtl.getByRole('button', { name: 'Scroll forward' }));
    expect(forward.x + forward.width / 2).toBeLessThan(rtlStrip.x + rtlStrip.width / 2);
    await rtl.getByRole('button', { name: 'Scroll forward' }).click();
    await expect
      .poll(() => rtl.locator('.ui-toolbar-scroller__strip').evaluate((node) => node.scrollLeft))
      .toBeLessThan(-100);
  });

  test('UIC-SCROLL-STRIP-1.4 follows horizontal wheel travel right to left', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const strip = page.locator(`${cell('rtl', 'off', 'start')} .ui-toolbar-scroller__strip`);
    const position = () => strip.evaluate((node) => node.scrollLeft);
    await strip.hover();
    await page.mouse.wheel(-60, 0);
    await expect.poll(position).toBeLessThan(-30);
    const afterLeft = await position();
    await page.mouse.wheel(0, 40);
    await expect.poll(position).toBeLessThan(afterLeft);
    await page.mouse.wheel(400, 0);
    await expect.poll(position).toBe(0);
  });

  test('UIC-TOOLBAR-SCROLLER-2.4 keeps the page still at either end of a right-to-left strip', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const strip = page.locator(`${cell('rtl', 'off', 'start')} .ui-toolbar-scroller__strip`);
    await strip.evaluate((node) => node.scrollIntoView({ block: 'center' }));
    const pageTop = await page.evaluate(() => window.scrollY);
    await strip.hover();
    await page.mouse.wheel(0, 3000);
    await page.mouse.wheel(0, 300);
    await page.mouse.wheel(-300, 0);
    await page.mouse.wheel(0, -3000);
    await page.mouse.wheel(0, -300);
    await page.mouse.wheel(300, 0);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.scrollY)).toBe(pageTop);
  });

  test('UIC-TOOLBAR-SCROLLER-1.2 UIC-TOOLBAR-SCROLLER-2.5 moves focus with the arrow keys and keeps it in view', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const root = page.locator('[data-lab-case="keyboard"] .ui-toolbar-scroller');
    const toolbar = root.getByRole('toolbar', { name: 'Document tools' });
    const tools = toolbar.getByRole('button');
    const count = await tools.count();
    await tools.first().focus();
    await expect(tools.first()).toBeFocused();
    for (let index = 1; index < count; index += 1) {
      await page.keyboard.press('ArrowRight');
      const tool = tools.nth(index);
      await expect(tool).toBeFocused();
      await expect
        .poll(async () => {
          const strip = await box(toolbar);
          const item = await box(tool);
          let left = strip.x;
          let right = strip.x + strip.width;
          for (const edge of ['start', 'end']) {
            const button = root.locator(`.ui-toolbar-scroller__scroll-button[data-edge="${edge}"]`);
            if (!(await button.isVisible())) continue;
            const covered = await box(button);
            if (edge === 'start') left = covered.x + covered.width;
            else right = covered.x;
          }
          return item.x >= left - 1 && item.x + item.width <= right + 1;
        })
        .toBe(true);
    }
    await expect(root).toHaveAttribute('data-overflow-start', 'true');
    await expect(root).not.toHaveAttribute('data-overflow-end');
    await page.keyboard.press('Tab');
    await expect(toolbar.locator(':focus')).toHaveCount(0);
    await page.keyboard.press('Shift+Tab');
    await expect(tools.last()).toBeFocused();
    await lab.expectAccessible();
  });

  test('UIC-TOOLBAR-SCROLLER-3.2 keeps high-priority tools and lists the rest in a menu', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const toolbar = (width: string) => page.getByRole('toolbar', { name: `Editing, ${width}` });
    await expect(toolbar('wide').locator('.ui-toolbar-scroller__item')).toHaveCount(9);
    await expect(toolbar('wide').locator('.ui-toolbar-scroller__overflow')).toHaveCount(0);
    const narrow = toolbar('narrow');
    const kept = await narrow.locator('.ui-toolbar-scroller__item').allTextContents();
    expect(kept.length).toBeLessThan(9);
    expect(kept).toContain('Save');
    await expect(narrow.locator(':scope > :last-child')).toHaveClass(
      /ui-toolbar-scroller__overflow/,
    );
    const box = await narrow.boundingBox();
    const more = narrow.getByRole('button', { name: `${9 - kept.length} more items` });
    const moreBox = await more.boundingBox();
    expect((moreBox?.x ?? 0) + (moreBox?.width ?? 0)).toBeLessThanOrEqual(
      (box?.x ?? 0) + (box?.width ?? 0) + 0.5,
    );
    await narrow.getByRole('button', { name: kept[0] }).focus();
    for (let step = 1; step < kept.length; step += 1) await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(more).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('menuitem', { name: 'Code' }).click();
    await expect(page.locator('[data-lab-menu="narrow"] [data-lab-output="last"]')).toHaveText(
      'Last tool: Code',
    );
    await lab.expectAccessible();
  });

  test('UIC-TOOLBAR-SCROLLER-3.3 keeps tool drafts and focus across overflow modes', async ({
    page,
    lab,
  }) => {
    await lab.open('toolbar-scroller');
    const demo = page.locator('[data-lab-demo="switching-mode"]');
    const find = demo.getByRole('textbox', { name: 'Find' });
    await find.fill('draft');
    await find.evaluate((element) => Object.assign(element, { labMarker: true }));
    const toggle = demo.getByRole('button', { name: /^Switch to/ });
    for (const mode of ['menu', 'scroll', 'menu']) {
      await toggle.click();
      await expect(demo.locator('.ui-toolbar-scroller')).toHaveAttribute('data-overflow', mode);
      await expect(find).toHaveValue('draft');
      expect(await find.evaluate((element) => 'labMarker' in element)).toBe(true);
    }
    // A switch that does not take focus away keeps it in the tool.
    await find.focus();
    await toggle.dispatchEvent('click');
    await expect(demo.locator('.ui-toolbar-scroller')).toHaveAttribute('data-overflow', 'scroll');
    await expect(find).toBeFocused();
    await lab.expectAccessible();
  });
});
