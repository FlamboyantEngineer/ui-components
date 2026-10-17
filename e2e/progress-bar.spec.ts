import { expect, test } from './fixtures.js';

test.describe('Progress Bar lab', () => {
  test('UIC-PROGRESS-BAR-1.1 UIC-PROGRESS-BAR-1.6 draws named bars with 4, 6 and 8 pixel tracks', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const cells = page.locator('table[data-lab-matrix="state size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(4 * 3);
    for (const [size, height] of [
      ['sm', 4],
      ['md', 6],
      ['lg', 8],
    ] as const) {
      const cell = page.locator(`[data-lab-cell="state=partial size=${size}"]`);
      await expect(cell.getByRole('progressbar', { name: 'Uploading' })).toBeVisible();
      const track = await cell.locator('.ui-progress-bar__track').boundingBox();
      expect(track?.height).toBe(height);
    }
  });

  test('UIC-PROGRESS-BAR-1.2 UIC-PROGRESS-BAR-1.3 fills to the value and claims no level while indeterminate', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const partial = page.locator('[data-lab-cell="state=partial size=md"]');
    const track = await partial.locator('.ui-progress-bar__track').boundingBox();
    const fill = await partial.locator('.ui-progress-bar__fill').boundingBox();
    expect(Math.round(((fill?.width ?? 0) / (track?.width ?? 1)) * 100)).toBe(40);
    await expect(partial.locator('.ui-progress-bar__value')).toHaveText('40%');

    const indeterminate = page
      .locator('[data-lab-cell="state=indeterminate size=md"]')
      .getByRole('progressbar');
    await expect(indeterminate).toHaveAttribute('data-indeterminate', 'true');
    await expect(indeterminate).not.toHaveAttribute('aria-valuenow');
    await expect(indeterminate.locator('.ui-progress-bar__value')).toHaveCount(0);
  });

  test('UIC-PROGRESS-BAR-1.2 follows a count to its total', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const demo = page.locator('[data-lab-demo="count"]');
    const bar = demo.getByRole('progressbar', { name: 'Copied files' });
    const forward = demo.getByRole('button', { name: 'Step forward' });
    await expect(bar).toHaveAttribute('aria-valuetext', '2/5');
    for (const expected of ['3/5', '4/5', '5/5']) {
      await forward.click();
      await expect(demo.locator('.ui-progress-bar__value')).toHaveText(expected);
    }
    await expect(bar).toHaveAttribute('aria-valuenow', '5');
    await expect(forward).toBeDisabled();
  });

  test('UIC-PROGRESS-BAR-2.1 draws hidden spinners in three sizes', async ({ page, lab }) => {
    await lab.open('progress-bar');
    for (const [size, edge] of [
      ['sm', 12],
      ['md', 16],
      ['lg', 20],
    ] as const) {
      const spinner = page.locator(`[data-lab-cell="size=${size}"] .ui-spinner`);
      await expect(spinner).toHaveAttribute('aria-hidden', 'true');
      // The box spins, so measure its layout size rather than its rotated bounds.
      const box = await spinner.evaluate((node: HTMLElement) => [
        node.offsetWidth,
        node.offsetHeight,
      ]);
      expect(box).toEqual([edge, edge]);
    }
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-1.8 colours each status and marks a full bar complete', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const bar = (tone: string, progress: string) =>
      page.locator(`[data-lab-cell="tone=${tone} progress=${progress}"] .ui-progress-bar`);
    const fillColour = (tone: string, progress: string) =>
      bar(tone, progress)
        .locator('.ui-progress-bar__fill')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
    await expect(bar('neutral', '100%')).toHaveAttribute('data-complete', 'true');
    await expect(bar('neutral', '60%')).not.toHaveAttribute('data-complete');
    const colours = new Set(
      await Promise.all(
        ['neutral', 'success', 'warning', 'danger'].map((tone) => fillColour(tone, '60%')),
      ),
    );
    expect(colours.size).toBe(4);
    expect(await fillColour('neutral', '100%')).toBe(await fillColour('success', '60%'));
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-2.2 names a standalone spinner', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const spinner = page.locator('[data-lab-cell="standalone=md"] .ui-spinner');
    await expect(spinner).toHaveRole('progressbar');
    await expect(spinner).toHaveAccessibleName('Loading recipes');
    await expect(spinner).not.toHaveAttribute('aria-hidden');
    expect(await spinner.evaluate((node: HTMLElement) => node.offsetWidth)).toBe(16);
    await lab.expectAccessible();
  });
});
