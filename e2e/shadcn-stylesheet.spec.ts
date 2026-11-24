import type { Locator } from '@playwright/test';
import { expect, matrixCell, test } from './fixtures.js';

const themes = ['light', 'dark'] as const;

/** Compares the solid part of the drawn focus shadow with the canvas immediately outside it. */
function focusContrast(button: Locator) {
  return button.evaluate((element) => {
    const shadow = getComputedStyle(element).boxShadow;
    const focus = /(?:rgba?|oklab|oklch|color)\([^)]*\)/.exec(shadow)?.[0];
    if (!focus) return 1;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('The canvas could not read the rendered focus color');
    const luminance = () => {
      const [red, green, blue] = Array.from(context.getImageData(0, 0, 1, 1).data, (value) => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
    };
    context.fillStyle = getComputedStyle(document.documentElement).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const background = luminance();
    context.fillStyle = focus;
    context.fillRect(0, 0, 1, 1);
    const ring = luminance();
    return (Math.max(background, ring) + 0.05) / (Math.min(background, ring) + 0.05);
  });
}

for (const theme of themes) {
  test(`UIC-LABS-3.11 draws a distinct keyboard focus mark in ${theme}`, async ({ page, lab }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await lab.open('button', { stylesheet: 'shadcn', theme });
    await page.keyboard.press('Tab');
    for (const variant of ['ghost', 'destructive'] as const) {
      const button = matrixCell(page, { variant, size: 'md' }).getByRole('button', {
        name: 'Save changes',
      });
      await button.focus();
      await expect(button).toHaveAttribute('data-focus-visible', 'true');
      expect(await focusContrast(button)).toBeGreaterThanOrEqual(3);
    }
  });

  test(`UIC-LABS-3.10 UIC-LABS-3.11 strengthens editable field borders in ${theme}`, async ({
    page,
    lab,
  }) => {
    await page.emulateMedia({ contrast: 'no-preference', reducedMotion: 'reduce' });
    await lab.open('combobox', { stylesheet: 'shadcn', theme });
    const combo = page.locator('.ui-combobox__field').filter({
      has: page.getByRole('combobox', { name: 'Fruit', exact: true }),
    });
    const text = page.getByRole('textbox', { name: 'Note (flex, empty)', exact: true });
    const read = (control: Locator) =>
      control.evaluate((element) => getComputedStyle(element).borderTopColor);
    const borders = await Promise.all([read(combo), read(text)]);
    await page.emulateMedia({ contrast: 'more' });
    const strongBorders = await Promise.all([read(combo), read(text)]);
    expect(strongBorders[0]).toBe(strongBorders[1]);
    expect(strongBorders[0]).not.toBe(borders[0]);
    expect(strongBorders[1]).not.toBe(borders[1]);
  });
}

test('UIC-LABS-3.11 keeps density through either nested dark theme boundary', async ({
  page,
  lab,
}) => {
  test.slow();
  await lab.open('control-sizes', { stylesheet: 'shadcn', theme: 'light' });
  const appearance = (name: string) =>
    page.getByRole('combobox', { name, exact: true }).evaluate((element) => {
      const field = element.closest('.ui-combobox__field');
      const styles = getComputedStyle(element);
      return {
        height: field?.getBoundingClientRect().height,
        fontSize: styles.fontSize,
        canvas: styles.getPropertyValue('--ref-canvas'),
      };
    });
  const light = await appearance('Compact density');
  expect(light).toMatchObject({ height: 28, fontSize: '13px' });
  expect(await appearance('Default density')).toMatchObject({ height: 32, fontSize: '14px' });
  const darkClass = await appearance('Compact with dark class');
  expect(darkClass.canvas).not.toBe(light.canvas);
  expect(darkClass).toMatchObject({ height: light.height, fontSize: light.fontSize });
  expect(await appearance('Compact with dark attribute')).toEqual(darkClass);
  await page.addStyleTag({
    content: '[data-ui-scale="compact"] > [data-theme] { --background: rgb(1, 2, 3); }',
  });
  expect(await appearance('Compact with dark attribute')).toEqual({
    ...darkClass,
    canvas: 'rgb(1, 2, 3)',
  });
});

test('UIC-LABS-3.11 UIC-COMBOBOX-1.2 keeps shadcn field and option sizes at narrow widths', async ({
  page,
  lab,
}) => {
  test.slow();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await lab.open('combobox', { stylesheet: 'shadcn', theme: 'light' });
  const sizes = [
    ['xs', 24],
    ['sm', 28],
    ['md', 32],
    ['lg', 36],
  ] as const;
  for (const [size, height] of sizes) {
    for (const variant of ['default', 'search'] as const) {
      const cell = matrixCell(page, { variant, state: 'resting', size });
      const root = cell.locator('.ui-combobox');
      const field = root.locator('.ui-combobox__field');
      expect((await field.boundingBox())?.height).toBe(height);
      await root.evaluate((element) => element.style.setProperty('width', '140px'));
      expect((await field.boundingBox())?.height).toBe(height);
    }
    const input = matrixCell(page, { variant: 'search', state: 'resting', size }).getByRole(
      'combobox',
    );
    await input.press('ArrowDown');
    const option = page.getByRole('option', { name: 'Banana', exact: true });
    await expect(option).toBeVisible();
    expect((await option.boundingBox())?.height).toBe(height);
    await expect(async () => {
      await input.fill('zz');
      const empty = page.locator('.ui-combobox__empty');
      await expect(empty).toHaveText('No results');
      expect((await empty.boundingBox())?.height).toBe(height);
    }).toPass();
    await input.press('Escape');
  }

  const multiple = page.getByRole('combobox', { name: 'Cities many md', exact: true });
  const frame = page.locator('.ui-combobox__field').filter({ has: multiple });
  expect((await frame.boundingBox())?.height).toBeGreaterThan(32);
});

test('UIC-LABS-3.11 UIC-SELECT-FIELD-14.1 reserves the native chevron clearance in both directions', async ({
  page,
  lab,
}) => {
  await lab.open('select-field', { stylesheet: 'shadcn', theme: 'light' });
  for (const name of ['Transfer rate', 'معدل النقل']) {
    const select = page.getByRole('combobox', { name, exact: true });
    await expect(select).toHaveCSS('padding-inline-start', '10px');
    await expect(select).toHaveCSS('padding-inline-end', '32px');
    const clearance = await select.evaluate((element) => {
      const icon = element.parentElement?.querySelector('.ui-select-field__native-icon');
      if (!icon) throw new Error('The native SelectField chevron was missing');
      const arrow = icon.getBoundingClientRect();
      const bounds = element.getBoundingClientRect();
      const { direction, paddingInlineEnd } = getComputedStyle(element);
      const arrowEdge = direction === 'rtl' ? arrow.right - bounds.left : bounds.right - arrow.left;
      return Number.parseFloat(paddingInlineEnd) - arrowEdge;
    });
    expect(clearance).toBeGreaterThanOrEqual(4);
  }
});
