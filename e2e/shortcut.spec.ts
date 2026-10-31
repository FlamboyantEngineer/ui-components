import { expect, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

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
      matrixCell(page, 'chord=Control+Alt+Shift+Meta+K platform=mac').locator('.ui-shortcut'),
    ).toHaveText(/^⌃⌥⇧⌘K/);
  });

  test('UIC-SHORTCUT-2.2 reads words instead of symbols', async ({ page, lab }) => {
    await lab.open('shortcut');
    const readable = matrixCell(page, 'text=readable platform=mac');
    const snapshot = await readable.ariaSnapshot();
    expect(snapshot).toContain('Shift Command K');
    expect(snapshot).not.toContain('⌘');
    const hidden = await readable.locator('.ui-shortcut__text').boundingBox();
    expect(hidden?.width ?? 0).toBeLessThanOrEqual(1);
    await expect(
      matrixCell(page, 'text=decorative platform=mac').locator('.ui-shortcut__text'),
    ).toHaveCount(0);

    await lab.expectAccessible();
  });

  test('UIC-SHORTCUT-3.1 lays a key legend out on one metadata line', async ({ page, lab }) => {
    await lab.open('shortcut');
    const legend = matrixCell(page, 'platform=windows').locator('.ui-key-hints');
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

  test('UIC-SHORTCUT-2.4 draws a key sequence chord by chord', async ({ page, lab }) => {
    await lab.open('shortcut');
    for (const [platform, text] of [
      ['mac', '⌘K ⌘C'],
      ['windows', 'Ctrl+K Ctrl+C'],
    ] as const) {
      const cell = matrixCell(page, `sequence=Ctrl+K Ctrl+C platform=${platform}`);
      await expect(cell.locator('.ui-shortcut__keys')).toHaveText(text);
      const chords = cell.locator('.ui-shortcut__chord');
      await expect(chords).toHaveCount(2);
      const [first, second] = await chords.evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().toJSON() as DOMRect),
      );
      expect(Math.round(requireDefined(first).top)).toBe(Math.round(requireDefined(second).top));
      expect(requireDefined(second).left - requireDefined(first).right).toBeGreaterThanOrEqual(4);
    }
    const snapshot = await matrixCell(page, 'sequence=G I platform=linux').ariaSnapshot();
    expect(snapshot).toContain('G, then I');
    const hints = page.locator('[data-lab-sequence-hints] .ui-key-hints__hint');
    await expect(hints.locator('.ui-shortcut__keys')).toHaveText(['G I', 'G S']);
    await expect(hints.locator('.ui-key-hints__action')).toHaveText([
      'go to inbox',
      'go to starred',
    ]);
    await lab.expectAccessible();
  });

  test('UIC-SHORTCUT-1.8 matches non-Latin letters and leaves AltGr text alone', async ({
    page,
    lab,
  }) => {
    await lab.open('shortcut');
    const field = page.getByRole('textbox', { name: 'Chord field' });
    const output = page.locator('[data-lab-output="chord"]');
    const press = (init: Record<string, string | boolean>) =>
      field.evaluate((node, options: Record<string, string | boolean>) => {
        node.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...options }));
      }, init);
    await press({ key: 'я', code: 'KeyZ', ctrlKey: true });
    await expect(output).toHaveText('Control+Я, Control+Z');
    await press({ key: '@', code: 'KeyQ', ctrlKey: true, altKey: true, modifierAltGraph: true });
    await expect(output).toHaveText('No chord');
    await press({ key: 'q', code: 'KeyQ', ctrlKey: true, altKey: true });
    await expect(output).toHaveText('Control+Alt+Q');
    await press({ key: '!', code: 'Digit1', ctrlKey: true, shiftKey: true });
    await expect(output).toHaveText('Ctrl+Shift+1');
  });
});
