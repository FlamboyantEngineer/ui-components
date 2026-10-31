import { expect, test, matrixCell } from './fixtures.js';

test.describe('Status Light lab', () => {
  test('UIC-STATUS-LIGHT-1.1 UIC-STATUS-LIGHT-1.3 draws 6, 8 and 10 pixel dots before their labels', async ({
    page,
    lab,
  }) => {
    await lab.open('status-light');
    const cells = page.locator('table[data-lab-matrix="tone size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(5 * 3);
    for (const [size, edge] of [
      ['sm', 6],
      ['md', 8],
      ['lg', 10],
    ] as const) {
      const light = matrixCell(page, `tone=success size=${size}`).locator(`.ui-status-light`);
      await expect(light).toHaveText('Running');
      const dot = await light.locator('.ui-status-light__dot').boundingBox();
      const label = await light.locator('.ui-status-light__label').boundingBox();
      expect([dot?.width, dot?.height]).toEqual([edge, edge]);
      expect(dot?.x ?? 0).toBeLessThan(label?.x ?? 0);
      // The dot is centred on the label's line.
      const dotMiddle = (dot?.y ?? 0) + (dot?.height ?? 0) / 2;
      const labelMiddle = (label?.y ?? 0) + (label?.height ?? 0) / 2;
      expect(Math.abs(dotMiddle - labelMiddle)).toBeLessThanOrEqual(1);
    }
    await lab.expectAccessible();
  });

  test('UIC-STATUS-LIGHT-1.2 colours each tone', async ({ page, lab }) => {
    await lab.open('status-light');
    const colours = await Promise.all(
      ['neutral', 'info', 'success', 'warning', 'danger'].map((tone) =>
        matrixCell(page, `tone=${tone} size=md`)
          .locator(`.ui-status-light__dot`)
          .evaluate((node) => getComputedStyle(node).backgroundColor),
      ),
    );
    expect(new Set(colours).size).toBe(5);
  });

  test('UIC-STATUS-LIGHT-1.4 UIC-STATUS-LIGHT-2.1 labels presence states and names dot-only lights', async ({
    page,
    lab,
  }) => {
    await lab.open('status-light');
    const cell = (status: string, label: string) =>
      matrixCell(page, `status=${status} label=${label}`).locator(`.ui-status-light`);
    const defaults = await Promise.all(
      ['active', 'away', 'busy', 'idle'].map((status) => cell(status, 'default').textContent()),
    );
    expect(defaults).toEqual(['Active', 'Away', 'Busy', 'Idle']);
    await expect(cell('away', 'custom')).toHaveText('Jon Berg, away');
    const dotOnly = cell('busy', 'dot only');
    await expect(dotOnly).toHaveRole('img');
    await expect(dotOnly).toHaveAccessibleName('Jon Berg is busy');
    await expect(dotOnly.locator('.ui-status-light__label')).toHaveCount(0);
    const dotColour = (status: string, label: string) =>
      cell(status, label)
        .locator('.ui-status-light__dot')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(await dotColour('busy', 'default')).toBe(await dotColour('busy', 'dot only'));
    expect(await dotColour('active', 'default')).not.toBe(await dotColour('away', 'default'));
    await lab.expectAccessible();
  });

  test('UIC-STATUS-LIGHT-1.5 UIC-STATUS-LIGHT-2.2 pulses a processing dot and takes no tab stop', async ({
    page,
    lab,
  }) => {
    await lab.open('status-light');
    const demo = page.locator('[data-lab-demo="deployment"]');
    const light = demo.locator('.ui-status-light');
    const start = demo.getByRole('button', { name: 'Start deployment' });
    await expect(light).toHaveText('Live');
    await expect(light).not.toHaveAttribute('data-processing');
    await start.click();
    await expect(light).toHaveText('Deploying');
    await expect(light).toHaveAttribute('data-processing', 'true');
    await expect(light.locator('.ui-status-light__dot')).toHaveCSS(
      'animation-name',
      'ref-status-light-pulse',
    );
    // A span with no tab index: Tab passes it by.
    expect(await light.evaluate((node: HTMLElement) => node.tabIndex)).toBe(-1);
    await expect(light).not.toHaveAttribute('role');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(light.locator('.ui-status-light__dot')).toHaveCSS('animation-name', 'none');
  });
});
