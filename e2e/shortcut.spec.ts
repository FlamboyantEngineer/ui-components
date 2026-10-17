import { expect, test } from './fixtures.js';

test.describe('Shortcut lab', () => {
  test('UIC-SHORTCUT-1.2 UIC-SHORTCUT-2.1 draws each notation as keycaps on one line', async ({
    page,
    lab,
  }) => {
    await lab.open('shortcut');
    for (const [platform, text] of [
      ['mac', '⇧⌘K'],
      ['windows', 'Ctrl+Shift+K'],
      ['linux', 'Ctrl+Shift+K'],
    ] as const) {
      const shortcut = page.locator(
        `[data-lab-cell="chord=Ctrl+Shift+K platform=${platform}"] .ui-shortcut`,
      );
      await expect(shortcut).toHaveAttribute('data-platform', platform);
      await expect(shortcut.locator('.ui-shortcut__keys')).toHaveText(text);
      const keys = shortcut.locator('.ui-shortcut__key');
      await expect(keys).toHaveCount(3);
      const boxes = await keys.evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect()),
      );
      expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
      for (const [index, box] of boxes.entries()) {
        expect(box.width).toBeGreaterThan(8);
        if (index > 0) expect(box.left).toBeGreaterThan(boxes[index - 1]?.right ?? 0);
      }
    }
    await expect(
      page.locator('[data-lab-cell="chord=Control+Alt+Shift+Meta+K platform=mac"] .ui-shortcut'),
    ).toHaveText(/^⌃⌥⇧⌘K/);
  });

  test('UIC-SHORTCUT-2.2 reads words instead of symbols', async ({ page, lab }) => {
    await lab.open('shortcut');
    const readable = page.locator('[data-lab-cell="text=readable platform=mac"]');
    const snapshot = await readable.ariaSnapshot();
    expect(snapshot).toContain('Shift Command K');
    expect(snapshot).not.toContain('⌘');
    const hidden = await readable.locator('.ui-shortcut__text').boundingBox();
    expect(hidden?.width ?? 0).toBeLessThanOrEqual(1);
    await expect(
      page.locator('[data-lab-cell="text=decorative platform=mac"] .ui-shortcut__text'),
    ).toHaveCount(0);

    await lab.expectAccessible();
  });

  test('UIC-SHORTCUT-3.1 lays a key legend out on one metadata line', async ({ page, lab }) => {
    await lab.open('shortcut');
    const legend = page.locator('[data-lab-cell="platform=windows"] .ui-key-hints');
    await expect(legend).toHaveClass(/ui-meta-line/);
    await expect(legend.locator('.ui-key-hints__hint')).toHaveCount(3);
    await expect(legend.locator('.ui-meta-line__separator')).toHaveCount(2);
    const lineHeight = await legend.evaluate((node) =>
      Number.parseFloat(getComputedStyle(node.parentElement as Element).lineHeight),
    );
    const box = await legend.boundingBox();
    expect(box?.height ?? 0).toBeLessThan(lineHeight * 1.8);
    expect(await legend.ariaSnapshot()).toContain('Up Arrow');
  });
});
