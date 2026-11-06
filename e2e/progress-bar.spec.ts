import { expect, matrix, matrixCell, test } from './fixtures.js';

test.describe('Progress Bar lab', () => {
  test('UIC-PROGRESS-BAR-1.1 UIC-PROGRESS-BAR-1.6 draws named bars with 4, 6 and 8 pixel tracks', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const cells = matrix(page, 'progress-bar-main').locator(
      'table[data-lab-matrix="state size"] td[data-lab-cell]',
    );
    expect(await cells.count()).toBe(4 * 3);
    for (const [size, height] of [
      ['sm', 4],
      ['md', 6],
      ['lg', 8],
    ] as const) {
      const cell = matrixCell(page, `state=partial size=${size}`, { family: 'progress-bar-main' });
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
    const partial = matrixCell(page, 'state=partial size=md', { family: 'progress-bar-main' });
    const track = await partial.locator('.ui-progress-bar__track').boundingBox();
    const fill = await partial.locator('.ui-progress-bar__fill').boundingBox();
    expect(Math.round(((fill?.width ?? 0) / (track?.width ?? 1)) * 100)).toBe(40);
    await expect(partial.locator('.ui-progress-bar__value')).toHaveText('40%');

    const indeterminate = matrixCell(page, 'state=indeterminate size=md', {
      family: 'progress-bar-main',
    }).getByRole('progressbar');
    await expect(indeterminate).toHaveAttribute('data-indeterminate', 'true');
    await expect(indeterminate).not.toHaveAttribute('aria-valuenow');
    await expect(indeterminate.locator('.ui-progress-bar__value')).toHaveCount(0);
  });

  test('UIC-PROGRESS-BAR-1.2 follows a count to its total', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const demo = matrix(page, 'progress-bar-main').locator('[data-lab-demo="count"]');
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

  test('UIC-PROGRESS-BAR-1.4 reads the value label as the text it shows', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const cell = matrixCell(page, 'option=value label').first();
    await expect(cell.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '2 of 3 files');
    await expect(cell.locator('.ui-progress-bar__value')).toHaveText('2 of 3 files');
  });

  test('UIC-PROGRESS-BAR-2.1 draws hidden spinners in three sizes', async ({ page, lab }) => {
    await lab.open('progress-bar');
    for (const [size, edge] of [
      ['sm', 12],
      ['md', 16],
      ['lg', 20],
    ] as const) {
      const spinner = matrixCell(page, `size=${size}`, { family: 'progress-bar-main' }).locator(
        `.ui-spinner`,
      );
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
      matrixCell(page, `tone=${tone} progress=${progress}`, {
        family: 'progress-bar-main',
      }).locator(`.ui-progress-bar`);
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
    for (const tone of ['neutral', 'success', 'warning', 'danger']) {
      const indeterminate = bar(tone, 'indeterminate');
      await expect(indeterminate).toHaveAttribute('data-tone', tone);
      await expect(indeterminate).toHaveAttribute('data-indeterminate', 'true');
      await expect(indeterminate).not.toHaveAttribute('data-complete');
      await expect(indeterminate).not.toHaveAttribute('aria-valuenow');
    }
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-2.2 names a standalone spinner', async ({ page, lab }) => {
    await lab.open('progress-bar');
    const spinner = matrixCell(page, 'standalone=md', { family: 'progress-bar-main' }).locator(
      '.ui-spinner',
    );
    await expect(spinner).toHaveRole('progressbar');
    await expect(spinner).toHaveAccessibleName('Loading recipes');
    await expect(spinner).not.toHaveAttribute('aria-hidden');
    expect(await spinner.evaluate((node: HTMLElement) => node.offsetWidth)).toBe(16);
    await lab.expectAccessible();
  });

  test('UIC-PROGRESS-BAR-2.2 keeps a named spinner inline in a sentence', async ({ page, lab }) => {
    // A turning ring's box grows with its angle; measure it at rest.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.open('progress-bar');
    const sentence = matrix(page, 'progress-bar-main').getByText(
      'Fetching the next page of results',
    );
    const spinner = sentence.getByRole('progressbar', { name: 'Loading results' });
    await expect(spinner).toHaveClass(/ui-spinner/);
    const [line, glyph] = await Promise.all([sentence.boundingBox(), spinner.boundingBox()]);
    // The glyph sits within the sentence's line box rather than breaking onto its own line.
    expect(
      line && glyph && glyph.y >= line.y && glyph.y + glyph.height <= line.y + line.height,
    ).toBe(true);
    expect(await spinner.evaluate((node: HTMLElement) => node.offsetWidth)).toBe(12);
  });

  test('UIC-PROGRESS-BAR-1.5 UIC-PROGRESS-BAR-11.3 UIC-PROGRESS-BAR-21.4 bounds values to ranges that start off zero', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const family = { family: 'progress-range-cases' };
    const expected = {
      '200 to 800': { below: ['200', '0%'], within: ['350', '25%'], above: ['800', '100%'] },
      '-50 to 50': { below: ['-50', '0%'], within: ['25', '75%'], above: ['50', '100%'] },
    } as const;
    for (const [range, values] of Object.entries(expected)) {
      for (const [value, [now, text]] of Object.entries(values)) {
        for (const kind of ['linear', 'circular', 'meter']) {
          const cell = matrixCell(page, `range=${range} value=${value} kind=${kind}`, family);
          const bar = cell.getByRole(kind === 'meter' ? 'meter' : 'progressbar');
          await expect(bar).toHaveAttribute('aria-valuenow', now);
          await expect(bar).toHaveAttribute('aria-valuetext', text);
          await expect(cell.locator('.ui-progress-bar__value, .ui-meter__value')).toHaveText(text);
        }
      }
    }
    const within = matrixCell(page, 'range=-50 to 50 value=within kind=linear', family);
    const track = await within.locator('.ui-progress-bar__track').boundingBox();
    const fill = await within.locator('.ui-progress-bar__fill').boundingBox();
    expect(Math.round(((fill?.width ?? 0) / (track?.width ?? 1)) * 100)).toBe(75);
  });

  test('UIC-PROGRESS-BAR-1.7 renders the caller root with its hooks, ref and values', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const demo = page.locator('[data-lab-demo="render"]');
    const bar = demo.getByRole('progressbar', { name: 'Importing photos' });
    await expect(bar).toHaveAttribute('data-lab-rendered', 'true');
    await expect(bar).toHaveAttribute('data-lab-bar', 'rendered');
    await expect(bar).toHaveClass(/ui-progress-bar/);
    const readout = demo.locator('[data-lab-output="values"]');
    await expect(readout).toHaveText('percentage 30 · value text 30% · measured');
    await demo.getByRole('button', { name: 'More' }).click();
    await expect(readout).toHaveText('percentage 40 · value text 40% · measured');
    await expect(bar).toHaveAttribute('aria-valuenow', '40');
    await demo.getByRole('button', { name: 'Stop measuring' }).click();
    await expect(readout).toHaveText('percentage none · value text none · indeterminate');
    await demo.getByRole('button', { name: 'Read the ref' }).click();
    await expect(demo.locator('[data-lab-output="ref"]')).toHaveText(/^div\.ui-progress-bar/);
  });

  test('UIC-PROGRESS-BAR-21.7 matches resolveMeterTone to the drawn meter tone', async ({
    page,
    lab,
  }) => {
    await lab.open('progress-bar');
    const demo = page.locator('[data-lab-demo="meter-tone"]');
    const meter = demo.getByRole('meter', { name: 'Disk used' });
    const tone = demo.locator('[data-lab-output="tone"]');
    for (const [presses, expected] of [
      [0, 'success'],
      [2, 'warning'],
      [2, 'danger'],
    ] as const) {
      for (let press = 0; press < presses; press += 1) {
        await demo.getByRole('button', { name: 'Use 10 GB' }).click();
      }
      await expect(tone).toHaveText(expected);
      await expect(meter).toHaveAttribute('data-tone', expected);
    }
  });
});
