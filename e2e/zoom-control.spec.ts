import { expect, familySelector, test, matrixCell } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

test.describe('Zoom Control lab', () => {
  test('UIC-ZOOM-CONTROL-1.1 UIC-ZOOM-CONTROL-1.5 UIC-ZOOM-CONTROL-1.9 draws the parts in order at four sizes', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    for (const [size, edge] of [
      ['xs', 20],
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const group = matrixCell(page, `state=default size=${size}`).getByRole('group', {
        name: `Zoom default ${size}`,
      });
      const zoomOut = await group.getByRole('button', { name: 'Zoom out' }).boundingBox();
      const slider = await group.getByRole('slider', { name: 'Zoom level' }).boundingBox();
      const zoomIn = await group.getByRole('button', { name: 'Zoom in' }).boundingBox();
      const value = await group.locator('output').boundingBox();
      expect(zoomOut?.width).toBe(edge);
      expect(zoomIn?.height).toBe(edge);
      expect(requireDefined(zoomOut).x).toBeLessThan(requireDefined(slider).x);
      expect(requireDefined(slider).x).toBeLessThan(requireDefined(zoomIn).x);
      expect(requireDefined(zoomIn).x).toBeLessThan(requireDefined(value).x);
    }
    await expect(matrixCell(page, 'state=between levels size=sm').locator('output')).toHaveText(
      '137.5%',
    );
  });

  test('UIC-ZOOM-CONTROL-1.3 UIC-ZOOM-CONTROL-1.4 requests levels from the buttons and the keyboard', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    const control = page.locator('[data-lab-case="requested"]');
    const applied = control.locator('[data-lab-output="zoom"]');
    await control.getByRole('button', { name: 'Zoom in' }).click();
    await expect(applied).toHaveText('125');
    const slider = control.getByRole('slider', { name: 'Zoom level' });
    await slider.focus();
    await page.keyboard.press('End');
    await expect(applied).toHaveText('200');
    await expect(slider).toHaveAttribute('aria-valuetext', '200%');
    await page.keyboard.press('ArrowLeft');
    await expect(applied).toHaveText('150');
    await page.keyboard.press('Home');
    await expect(applied).toHaveText('50');

    const zoomOut = control.getByRole('button', { name: 'Zoom out' });
    await expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    await control.getByRole('button', { name: 'Zoom in' }).click();
    await zoomOut.focus();
    await page.keyboard.press('Enter');
    await expect(applied).toHaveText('50');
    await expect(zoomOut).toBeFocused();
    await expect(zoomOut).toHaveAttribute('aria-disabled', 'true');
    await control.getByRole('button', { name: 'Reset zoom' }).click();
    await expect(applied).toHaveText('100');
    await expect(control.locator('[data-lab-output="log"]')).toHaveText('150, 50, 75, 50, 100');
  });

  test('UIC-ZOOM-CONTROL-1.4 steps the slider from a value between levels to an endpoint level', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    for (const [name, key, level] of [
      ['near-first', 'ArrowLeft', '100'],
      ['near-last', 'ArrowRight', '150'],
      ['near-first', 'End', '150'],
      ['near-last', 'Home', '100'],
    ] as const) {
      const demo = page.locator(`[data-lab-case="${name}"]`);
      await demo.getByRole('button', { name: /^Back to/ }).click();
      await demo.getByRole('slider', { name: 'Zoom level' }).focus();
      await page.keyboard.press(key);
      await expect(demo.locator('[data-lab-output="zoom"]')).toHaveText(level);
    }
    await lab.expectAccessible();
  });

  test('UIC-ZOOM-CONTROL-1.4 mirrors the slider keys right to left', async ({ page, lab }) => {
    await lab.open('zoom-control');
    const demo = page.locator('[data-lab-case="near-first"]');
    await demo.evaluate((element) => element.setAttribute('dir', 'rtl'));
    await demo.getByRole('slider', { name: 'Zoom level' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(demo.locator('[data-lab-output="zoom"]')).toHaveText('100');
  });

  test('UIC-ZOOM-CONTROL-1.7 disables the whole control and stays accessible', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    const disabled = matrixCell(page, 'state=disabled size=md');
    await expect(disabled.getByRole('slider')).toBeDisabled();
    await expect(disabled.getByRole('button', { name: 'Zoom in' })).toBeDisabled();
    await expect(
      matrixCell(page, 'state=last level size=md').getByRole('button', {
        name: 'Zoom in',
      }),
    ).toHaveAttribute('aria-disabled', 'true');
    await lab.expectAccessible();
  });

  for (const theme of ['light', 'dark']) {
    test(`UIC-ZOOM-CONTROL-1.10 requests preset percentages and reports named presets in the ${theme} theme`, async ({
      page,
      lab,
    }) => {
      await lab.open('zoom-control', { theme });
      const control = page.locator('[data-lab-case="presets"]');
      const trigger = control.getByRole('button', { name: 'Zoom presets' });
      const value = await control.locator('output.ui-zoom-control__value').boundingBox();
      const triggerBox = await trigger.boundingBox();
      expect(requireDefined(triggerBox).x).toBeGreaterThan(requireDefined(value).x);
      expect(requireDefined(triggerBox).width).toBe(24);

      await trigger.click();
      const menu = page.getByRole('menu', { name: 'Zoom presets' });
      await expect(menu.getByRole('menuitem')).toHaveText([
        'Fit width',
        'Fit page',
        '50%',
        '100%',
        '200%',
      ]);
      await lab.expectAccessible('[role="menu"]');
      await menu.getByRole('menuitem', { name: 'Fit width' }).click();
      await expect(control.locator('[data-lab-output="last"]')).toHaveText('fit-width');
      await expect(control.locator('output.ui-zoom-control__value')).toHaveText('137.5%');
      await expect(trigger).toBeFocused();

      await page.keyboard.press('Enter');
      await expect(menu).toBeVisible();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      await expect(control.locator('[data-lab-output="zoom"]')).toHaveText('50');
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(
        matrixCell(page, 'state=disabled size=md').locator('.ui-zoom-control__presets'),
      ).toBeDisabled();
      await lab.expectAccessible();
    });
  }
  test('UIC-ZOOM-CONTROL-1.4 UIC-ZOOM-CONTROL-1.9 sizes the slider with the control and lines it up with the buttons', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    const widths: number[] = [];
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      const control = page.getByRole('group', { name: `Zoom default ${size}` });
      const slider = await control.getByRole('slider').boundingBox();
      const button = await control.getByRole('button', { name: /out/i }).boundingBox();
      if (!slider || !button) throw new Error('The control is not laid out.');
      widths.push(slider.width);
      expect(Math.abs(slider.height - button.height)).toBeLessThanOrEqual(1);
      expect(
        Math.abs(slider.y + slider.height / 2 - (button.y + button.height / 2)),
      ).toBeLessThanOrEqual(1);
    }
    expect([...widths].sort((a, b) => a - b)).toEqual(widths);
    const smallest = page.getByRole('group', { name: 'Zoom default xs' }).getByRole('slider');
    await smallest.focus();
    await page.keyboard.press('ArrowRight');
    await expect(smallest).not.toHaveValue('');
  });
});

test('UIC-ZOOM-CONTROL-1.3 shows the zoom level helpers in a host-side snippet', async ({
  page,
  lab,
}) => {
  await lab.open('zoom-control');
  const call = (text: string) => page.locator(`[data-lab-call=${JSON.stringify(text)}]`);
  await expect(call('defaultZoomLevels')).toHaveText('25, 50, 75, 100, 125, 150, 200, 300, 400');
  await expect(call('findNextZoomLevel(defaultZoomLevels, 110, 1)')).toHaveText('125');
  await expect(call('findNextZoomLevel(defaultZoomLevels, 110, -1)')).toHaveText('100');
  await expect(call('findNextZoomLevel(defaultZoomLevels, 400, 1)')).toHaveText('undefined');
});

test.describe('Zoom Control formats', () => {
  test('UIC-ZOOM-CONTROL-1.5 formats fractional values per locale and reports raw requests', async ({
    page,
    lab,
  }) => {
    await lab.open('zoom-control');
    const demo = page.locator('[data-lab-demo="formatted-zoom"]');
    const part = (locale: string) => {
      const root = demo.locator(`[data-lab-locale="${locale}"]`);
      return {
        root,
        value: root.locator('output.ui-zoom-control__value'),
        slider: root.getByRole('slider'),
        requests: root.locator('[data-lab-output="requests"]'),
      };
    };
    const english = part('en-US');
    const german = part('de-DE');
    const expectText = async (locale: ReturnType<typeof part>, text: string) => {
      await expect(locale.value).toHaveText(text);
      // The same text, including the locale's non-breaking spaces.
      expect(await locale.slider.getAttribute('aria-valuetext')).toBe(
        await locale.value.textContent(),
      );
    };
    await expectText(english, '137.5%');
    await expectText(german, '137,5 %');
    await demo.getByRole('radio', { name: 'whole' }).press('Space');
    await expectText(english, '138%');
    await expectText(german, '138 %');
    await demo.getByRole('radio', { name: 'words' }).press('Space');
    await expectText(english, '137.5 percent');
    await expectText(german, '137,5 Prozent');

    await demo.getByRole('radio', { name: 'whole' }).press('Space');
    await english.root.getByRole('button', { name: 'Zoom out' }).click();
    await english.root.getByRole('button', { name: 'Zoom out' }).click();
    await expectText(english, '67%');
    await expect(english.requests).toHaveText('100, 66.67');
    await german.slider.focus();
    await page.keyboard.press('ArrowLeft');
    await expectText(german, '100 %');
    await expect(german.requests).toHaveText('100');
    await lab.expectAccessible(familySelector('zoom-control-format-cases'));
  });
});
