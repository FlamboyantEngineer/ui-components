import { expect, test, matrixCell } from './fixtures.js';

const longPath =
  '/Garden/Vegetable beds/North side/Raised bed four/Tomatoes/Seed saving/Final notes';

test.describe('Path lab', () => {
  test('UIC-PATH-2.1 UIC-PATH-2.2 clips a long path at its start and keeps the end on one line', async ({
    page,
    lab,
  }) => {
    for (const theme of ['light', 'dark']) {
      await lab.open('path', { theme });
      const path = matrixCell(page, 'content=long width=200px').locator('.ui-path');
      await expect(path).toHaveText(longPath);
      const geometry = await path.evaluate((element) => {
        const text = element.querySelector('bdi')?.firstChild as Text;
        const range = (start: number) => {
          const r = document.createRange();
          r.setStart(text, start);
          r.setEnd(text, start + 1);
          return r.getBoundingClientRect();
        };
        const box = element.getBoundingClientRect();
        const first = range(0);
        const last = range(text.length - 1);
        const style = getComputedStyle(element);
        const host = getComputedStyle(element.parentElement as HTMLElement);
        return {
          left: box.left,
          right: box.right,
          width: box.width,
          scrollWidth: element.scrollWidth,
          first: first.left,
          firstTop: first.top,
          lastLeft: last.left,
          lastRight: last.right,
          lastTop: last.top,
          overflow: style.textOverflow,
          font: style.fontSize === host.fontSize && style.fontFamily === host.fontFamily,
          color: style.color === host.color,
        };
      });
      expect(geometry.scrollWidth).toBeGreaterThan(geometry.width);
      expect(geometry.first).toBeLessThan(geometry.left);
      expect(geometry.lastLeft).toBeGreaterThanOrEqual(geometry.left);
      expect(geometry.lastRight).toBeLessThanOrEqual(geometry.right + 1);
      expect(Math.abs(geometry.firstTop - geometry.lastTop)).toBeLessThanOrEqual(1);
      expect(geometry.overflow).toBe('ellipsis');
      expect(geometry.font).toBe(true);
      expect(geometry.color).toBe(true);
      await expect(path.locator('a, nav, [tabindex]')).toHaveCount(0);
    }
  });

  test('UIC-PATH-2.2 shrinks beside an action and leaves short paths whole', async ({
    page,
    lab,
  }) => {
    await lab.open('path');
    const row = page.locator('[data-lab-row="long"]');
    const action = row.getByRole('button', { name: 'Manage' });
    await expect(action).toBeVisible();
    const rowBox = await row.boundingBox();
    const actionBox = await action.boundingBox();
    expect((actionBox?.x ?? 0) + (actionBox?.width ?? 0)).toBeLessThanOrEqual(
      (rowBox?.x ?? 0) + (rowBox?.width ?? 0) + 1,
    );
    await action.focus();
    await expect(action).toBeFocused();
    const short = page.locator('[data-lab-row="short"] .ui-path');
    await expect(short).toHaveText('/Garden');
    expect(await short.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    const labels = matrixCell(page, 'content=labels width=auto').locator('.ui-path');
    await expect(labels).toHaveText('Recipes/https://example.test/lemon-tart/Step 3');
    await lab.expectAccessible();
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-PATH-2.5 shows a cut path whole in a tooltip on hover and keyboard focus in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('path', { theme });
      const cut = page.locator('[data-lab-path="cut"]');
      const whole = page.locator('[data-lab-path="whole"]');
      expect(await cut.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
      await whole.hover();
      await page.waitForTimeout(800);
      await expect(page.getByRole('tooltip')).toHaveCount(0);

      await cut.hover();
      const panel = page.getByRole('tooltip');
      await expect(panel).toHaveText(longPath);
      await expect(panel).toHaveClass(/ui-truncation-tooltip__panel/);
      await expect(cut).not.toHaveAttribute('aria-describedby');
      const fits = await panel.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.right <= window.innerWidth && node.scrollWidth <= node.clientWidth + 1;
      });
      expect(fits).toBe(true);
      await lab.expectAccessible();
      await page.mouse.move(0, 0);
      await expect(panel).toHaveCount(0);

      await whole.click();
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-lab-path="link"]')).toBeFocused();
      await expect(page.getByRole('tooltip')).toHaveText(longPath);
      await page.keyboard.press('Tab');
      await expect(page.getByRole('tooltip')).toHaveCount(0);
    });
  }
});

test('UIC-PATH-1.3 shows the exported helpers in a host-side snippet', async ({ page, lab }) => {
  await lab.open('path');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call("formatFolderPath(folders, 'tomatoes')")).toHaveText(
    '/Garden/Vegetable beds/Tomatoes',
  );
});
