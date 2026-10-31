import { expect, test, matrixCell } from './fixtures.js';

test.describe('Segmented Bar lab', () => {
  test('UIC-SEGMENTED-BAR-1.1 UIC-SEGMENTED-BAR-1.6 UIC-SEGMENTED-BAR-2.1 draws named groups with 4, 8 and 12 pixel tracks', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-bar');
    const cells = page.locator('table[data-lab-matrix="legend size"] td[data-lab-cell]');
    expect(await cells.count()).toBe(2 * 3);
    for (const [size, height] of [
      ['sm', 4],
      ['md', 8],
      ['lg', 12],
    ] as const) {
      const cell = matrixCell(page, `legend=hidden size=${size}`);
      const bar = cell.getByRole('group', { name: 'Checks' });
      await expect(bar).toHaveAttribute('data-size', size);
      const track = await cell.locator('.ui-segmented-bar__track').boundingBox();
      expect(track?.height).toBe(height);
      await expect(bar.getByRole('listitem')).toHaveText([
        /Passed\s*42\s*70%/,
        /Failed\s*6\s*10%/,
        /Blocked\s*4\s*6\.7%/,
        /Skipped\s*8\s*13\.3%/,
      ]);
    }
    await lab.expectAccessible();
  });

  test('UIC-SEGMENTED-BAR-1.2 UIC-SEGMENTED-BAR-1.4 sizes segments by share and shows or hides the legend', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-bar');
    // Shares of the track, or of the segments together when they fill it around the gaps.
    const shares = async (cell: string, of: 'track' | 'segments') => {
      const scope = matrixCell(page, cell);
      const track = await scope.locator('.ui-segmented-bar__track').boundingBox();
      const widths = await scope
        .locator('.ui-segmented-bar__segment')
        .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
      const whole = of === 'track' ? (track?.width ?? 1) : widths.reduce((sum, w) => sum + w, 0);
      return widths.map((width) => Math.round((width / whole) * 100));
    };
    expect(await shares('legend=hidden size=lg', 'segments')).toEqual([70, 10, 7, 13]);
    expect(await shares('option=larger total', 'track')).toEqual([35, 5, 3, 7]);
    expect(await shares('option=empty', 'track')).toEqual([]);
    const legend = (cell: string) => matrixCell(page, cell).locator(`.ui-segmented-bar__legend`);
    const hidden = legend('legend=hidden size=md').locator('xpath=..');
    const shown = legend('legend=shown size=md');
    await expect(hidden).toHaveClass(/ui-visually-hidden/);
    expect((await hidden.boundingBox())?.height ?? 0).toBeLessThanOrEqual(1);
    await expect(shown).toBeVisible();
    await expect(matrixCell(page, 'option=empty').getByRole('listitem')).toHaveCount(4);
  });

  test('UIC-SEGMENTED-BAR-1.3 colours each tone on the segment and its swatch', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-bar');
    const colours: string[] = [];
    for (const tone of ['neutral', 'info', 'success', 'warning', 'danger']) {
      const cell = matrixCell(page, `tone=${tone}`);
      const segment = cell.locator(`.ui-segmented-bar__segment[data-tone="${tone}"]`).first();
      const swatch = cell
        .locator(`.ui-segmented-bar__item[data-tone="${tone}"] .ui-segmented-bar__swatch`)
        .first();
      const colour = await segment.evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(await swatch.evaluate((node) => getComputedStyle(node).backgroundColor)).toBe(colour);
      colours.push(colour);
    }
    expect(new Set(colours).size).toBe(5);
  });

  test('UIC-SEGMENTED-BAR-1.5 formats totals and counts, and fills toward a total', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-bar');
    const storage = page.locator('[data-lab-demo="storage"]');
    await expect(storage.locator('.ui-segmented-bar__total')).toHaveText('128 GB total');
    await expect(storage.getByRole('listitem').first()).toHaveText(/Photos\s*38\.5 GB\s*30\.1%/);
    await expect(
      matrixCell(page, 'option=total hidden').locator('.ui-segmented-bar__total'),
    ).toHaveCount(0);
    await expect(
      matrixCell(page, 'option=aria-label only').getByRole('group', { name: 'Checks' }),
    ).toBeVisible();
    const running = page.locator('[data-lab-demo="running"]');
    const next = running.getByRole('button', { name: 'Run next check' });
    for (let run = 0; run < 10; run += 1) await next.click();
    await expect(running.getByRole('listitem')).toHaveText([
      /Passed\s*9\s*75%/,
      /Failed\s*1\s*8\.3%/,
    ]);
    await expect(running.locator('.ui-segmented-bar__segment')).toHaveCount(2);
    const large = page.getByRole('group', { name: 'Large amounts' });
    await expect(large.locator('.ui-segmented-bar__item-share')).toHaveText(['50%', '50%']);
    expect(
      await large
        .locator('.ui-segmented-bar__segment')
        .evaluateAll((segments) => segments.map((segment) => (segment as HTMLElement).style.width)),
    ).toEqual(['50%', '50%']);
    await lab.expectAccessible();
  });

  test('UIC-SEGMENTED-BAR-1.2 keeps many small parts and the majority inside the track', async ({
    page,
    lab,
  }) => {
    await lab.open('segmented-bar');
    const geometry = (cell: string) =>
      matrixCell(page, cell)
        .locator(`.ui-segmented-bar__track`)
        .evaluate((track) => {
          const box = track.getBoundingClientRect();
          const majority = track.lastElementChild?.getBoundingClientRect();
          return {
            width: box.width,
            overflow: track.scrollWidth - track.clientWidth,
            majority: majority?.width ?? 0,
            inside: majority
              ? majority.left >= box.left - 0.5 && majority.right <= box.right + 0.5
              : false,
            left: (majority?.left ?? 0) - box.left,
          };
        });
    for (const width of [250, 150]) {
      await page
        .locator('[data-lab-resizable="many"]')
        .evaluateAll(
          (nodes, w) => nodes.forEach((node) => ((node as HTMLElement).style.width = `${w}px`)),
          width,
        );
      for (const direction of ['ltr', 'rtl']) {
        const whole = await geometry(`direction=${direction} remainder=none`);
        expect(whole.overflow).toBe(0);
        expect(whole.inside).toBe(true);
        expect(Math.abs(whole.majority - whole.width * 0.9)).toBeLessThan(1);
        // The majority comes last: after the small parts, at the inline end.
        expect(Math.abs(whole.left - (direction === 'rtl' ? 0 : whole.width * 0.1))).toBeLessThan(
          1,
        );
        const half = await geometry(`direction=${direction} remainder=explicit`);
        expect(half.overflow).toBe(0);
        expect(Math.abs(half.majority - half.width * 0.45)).toBeLessThan(1);
      }
    }
    const legend = matrixCell(page, 'direction=ltr remainder=none').getByRole('listitem').last();
    await expect(legend).toContainText('Majority');
    await expect(legend).toContainText('90%');
  });
});
