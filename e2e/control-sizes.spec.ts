import type { Page } from '@playwright/test';
import { cellSelector, expect, matrixCell, test } from './fixtures.js';
import { requireDefined } from '../src/utils/require-defined.js';

/** The box whose height each control of the control sizes lab takes from its size. */
const boxes: Record<string, string> = {
  button: '.ui-button',
  'button-icon': '.ui-button[data-content="icon"]',
  'dropdown-menu': ':is(.ui-button, .ui-button[data-content="icon"])',
  'segmented-choice': '.ui-segmented-choice',
  'search-field': '.ui-search-field',
  combobox: '.ui-combobox__field',
  menubar: '.ui-menubar__trigger',
  'text-field': '.ui-text-field__input',
  'select-field': '.ui-select-field__trigger',
  'number-field': '.ui-number-field__group',
  'date-time-field': '.ui-date-time-field__group',
  'color-field': ':is(.ui-color-field__group, .ui-color-field__trigger)',
  'tags-input': '.ui-tags-input__group',
  'boolean-field': '.ui-boolean-field__toggle-button',
  checkbox: '.ui-checkbox',
  'choice-group-multiple': '.ui-checkbox',
  switch: '.ui-switch',
  'choice-group': '.ui-choice__button',
  'pin-input': '.ui-pin-input__cell',
  'relative-date-field': '.ui-relative-date-field__trigger',
  'formula-bar': '.ui-formula-bar__reference',
  'zoom-control': '.ui-zoom-control',
};

/** Controls deliberately off the scale by a fixed step: a PIN cell holds one large character. */
const offsets: Record<string, number> = { 'pin-input': 8 };

/** Each control cell's box height and the height its size's token gives now. */
async function measureCells(page: Page) {
  return page.locator('td[data-lab-cell*="control="]').evaluateAll(
    (tds, { selectors, offset }) =>
      tds.map((td) => {
        const address = td.getAttribute('data-lab-cell') ?? '';
        const control = /control=(\S+)/.exec(address)?.[1] ?? '';
        const size = /size=(\S+)/.exec(address)?.[1] ?? '';
        const box = td.querySelector(selectors[control] ?? ':not(*)');
        const scale = getComputedStyle(document.documentElement);
        const token = scale.getPropertyValue(`--ref-control-height-${size}`).trim();
        return {
          address,
          control,
          size,
          height: box ? Math.round(box.getBoundingClientRect().height) : null,
          // The scale is in rem, so it follows the reader's font size; an override may use pixels.
          expected:
            (token.endsWith('px')
              ? Number.parseFloat(token)
              : Number.parseFloat(token) * Number.parseFloat(scale.fontSize)) +
            (offset[control] ?? 0),
        };
      }),
    { selectors: boxes, offset: offsets },
  );
}

/** The cells whose box is not the height of their size. */
function offSize(cells: Awaited<ReturnType<typeof measureCells>>) {
  return cells
    .filter(({ height, expected }) => height !== null && height !== expected)
    .map(({ address, height, expected }) => `${address}: ${height}px, not ${expected}px`);
}

test('UIC-LABS-3.7 every control takes the height of its size, not of its content or type', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const cells = await measureCells(page);
  expect(new Set(cells.map(({ control }) => control))).toEqual(new Set(Object.keys(boxes)));
  expect(cells.length).toBe(Object.keys(boxes).length * 3 * 4);
  const missing = cells.filter(({ height }) => height === null).map(({ address }) => address);
  expect(missing, 'cells without their control').toEqual([]);
  expect(offSize(cells), 'controls off their size').toEqual([]);
  await lab.expectAccessible();
});

test('UIC-LABS-3.7 overriding the control scale moves every control of that size', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  await page.evaluate(() => {
    const root = document.documentElement.style;
    for (const [size, height] of [
      ['xs', 30],
      ['sm', 34],
      ['md', 38],
      ['lg', 42],
    ] as const)
      root.setProperty(`--ref-control-height-${size}`, `${String(height)}px`);
  });
  const cells = await measureCells(page);
  // The rows of checkboxes and switches grow from a min-height and keep their own boxes.
  const framed = cells.filter(
    ({ control }) =>
      !['checkbox', 'choice-group-multiple', 'switch', 'choice-group'].includes(control),
  );
  expect(offSize(framed), 'controls off the overridden scale').toEqual([]);
});

test('UIC-LABS-3.7 distinguishes surrounding type and keeps field samples compact', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const large = matrixCell(page, 'control=button content=large type size=md');
  const short = matrixCell(page, 'control=button content=short size=md');
  await expect(large.locator('[data-lab-control-sample] > span')).toHaveCSS('font-size', '24px');
  await expect(short.locator('[data-lab-control-sample] > span')).toHaveCSS('font-size', '14px');
  await expect(large.getByRole('button')).toHaveCSS('font-size', '13px');
  await expect(short.getByRole('button')).toHaveCSS('font-size', '13px');
  const gaps = await page.locator('[data-lab-control-sample] .ui-field').evaluateAll((fields) =>
    fields.flatMap((field) => {
      const control = field.querySelector('.ui-field__control');
      if (!control) return [];
      const extra = field.getBoundingClientRect().height - control.getBoundingClientRect().height;
      return extra > 1 ? [`${field.className}: ${extra}px`] : [];
    }),
  );
  expect(gaps, 'empty feedback rows below controls').toEqual([]);
});

test("UIC-LABS-3.7 the type and control scales follow the reader's font size", async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const button = matrixCell(page, 'control=button content=short size=md').locator('.ui-button');
  await expect(button).toHaveCSS('height', '28px');
  await expect(button).toHaveCSS('font-size', '13px');
  // A browser font-size preference of 20 pixels sets the root's font size.
  await page.addStyleTag({ content: ':root { font-size: 20px; }' });
  await expect(button).toHaveCSS('height', '35px');
  await expect(button).toHaveCSS('font-size', '16.25px');
});

test("UIC-LABS-3.5 UIC-LABS-3.7 line boxes and search inputs follow the reader's font size", async ({
  page,
  lab,
}) => {
  await lab.open('breadcrumb');
  const trail = page.getByRole('navigation', { name: 'Trail, four crumbs, md' });
  await expect(trail).toHaveCSS('line-height', '24px');
  await page.addStyleTag({ content: ':root { font-size: 20px; }' });
  await expect(trail).toHaveCSS('line-height', '30px');

  await lab.open('emoji-picker');
  const search = page.locator('[data-lab-demo="virtualized"]').getByRole('searchbox');
  await expect(search).toHaveCSS('height', '28px');
  await page.addStyleTag({ content: ':root { font-size: 20px; }' });
  await expect(search).toHaveCSS('height', '35px');
});

test('UIC-LABS-3.7 checkbox and radio groups show independent and exclusive choices', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const checkboxes = page.locator(
    cellSelector('control=choice-group-multiple content=short size=md'),
  );
  await expect(checkboxes.getByRole('checkbox')).toHaveCount(3);
  await checkboxes.getByRole('checkbox', { name: 'Pear' }).focus();
  await page.keyboard.press('Space');
  await expect(checkboxes.getByRole('checkbox', { name: 'Apple' })).toBeChecked();
  await expect(checkboxes.getByRole('checkbox', { name: 'Pear' })).toBeChecked();
  const radios = matrixCell(page, 'control=choice-group content=short size=md');
  await expect(radios.getByRole('radio')).toHaveCount(3);
  await radios.getByRole('radio', { name: 'Apple' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(radios.getByRole('radio', { name: 'Apple' })).not.toBeChecked();
  await expect(radios.getByRole('radio', { name: 'Pear' })).toBeChecked();
});

for (const [size, height] of [
  ['xs', 20],
  ['sm', 24],
  ['md', 28],
  ['lg', 32],
] as const) {
  test(`UIC-COMBOBOX-1.2 UIC-COMBOBOX-2.6 ${size} options and empty text follow the field size`, async ({
    page,
    lab,
  }) => {
    await lab.open('control-sizes');
    const cell = matrixCell(page, `control=combobox content=short size=${size}`);
    const input = cell.getByRole('combobox');
    await input.focus();
    await page.keyboard.press('ArrowDown');
    const option = page.getByRole('option', { name: 'Apple', exact: true });
    await expect(option).toBeVisible();
    expect((await option.boundingBox())?.height).toBe(height);
    const font = await input.evaluate((element) => getComputedStyle(element).fontSize);
    await expect(option).toHaveCSS('font-size', font);
    await expect(async () => {
      await input.fill('zz');
      await expect(page.locator('.ui-combobox__empty')).toBeVisible();
    }).toPass();
    const empty = page.locator('.ui-combobox__empty');
    await expect(empty).toHaveText('No results');
    await expect(empty).toHaveCSS('font-size', font);
    expect((await empty.boundingBox())?.height).toBe(height);
    await lab.expectAccessible('.ui-combobox__popover');
  });
}

test('UIC-DROPDOWN-MENU-1.4 opening a dropdown preserves page scrolling', async ({ page, lab }) => {
  await lab.open('control-sizes');
  const trigger = matrixCell(page, 'control=dropdown-menu content=short size=md').getByRole(
    'button',
    { name: 'Edit' },
  );
  await trigger.focus();
  const before = await page.evaluate(() => ({
    overflow: getComputedStyle(document.documentElement).overflowY,
    width: document.documentElement.clientWidth,
  }));
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'Edit' });
  await expect(menu).toBeVisible();
  expect(
    await page.evaluate(() => ({
      overflow: getComputedStyle(document.documentElement).overflowY,
      width: document.documentElement.clientWidth,
    })),
  ).toEqual(before);
  const gap = async () =>
    Math.round(
      requireDefined(await menu.boundingBox()).y - requireDefined(await trigger.boundingBox()).y,
    );
  const offset = await gap();
  const top = await page.evaluate(() => window.scrollY);
  await page.mouse.move(600, 500);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(top);
  await expect(menu).toBeVisible();
  await expect.poll(gap).toBe(offset);
});

test('UIC-LABS-3.7 chip-like controls show descenders, capitals and accents whole', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const clipped = await page
    .locator(
      '[data-lab-section="Chips keep whole letters"] :is(.ui-badge__label, .ui-tag-group__label, .ui-select-field__chip-label)',
    )
    .evaluateAll((labels) => {
      const canvas = document.createElement('canvas').getContext('2d');
      const problems: string[] = [];
      for (const label of labels) {
        if (!canvas || !(label instanceof HTMLElement)) continue;
        const style = getComputedStyle(label);
        canvas.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const text = label.textContent ?? '';
        const ink = canvas.measureText(text);
        const font = canvas.measureText('M');
        // The line's baseline: the font's ascent and descent are centred in the line height.
        const box = label.getBoundingClientRect();
        const lineHeight =
          style.lineHeight === 'normal'
            ? font.fontBoundingBoxAscent + font.fontBoundingBoxDescent
            : Number.parseFloat(style.lineHeight);
        const contentTop = box.top + Number.parseFloat(style.paddingTop);
        const half = (lineHeight - font.fontBoundingBoxAscent - font.fontBoundingBoxDescent) / 2;
        const baseline = contentTop + half + font.fontBoundingBoxAscent;
        // The label clips to its padding box; its parents clip too where they hide overflow.
        let clipTop = box.top;
        let clipBottom = box.bottom;
        for (let node: HTMLElement | null = label; node; node = node.parentElement) {
          if (getComputedStyle(node).overflowY === 'visible' && node !== label) continue;
          const area = node.getBoundingClientRect();
          clipTop = Math.max(clipTop, area.top);
          clipBottom = Math.min(clipBottom, area.bottom);
          if (node.matches('[data-lab-cell]')) break;
        }
        const inkTop = baseline - ink.actualBoundingBoxAscent;
        const inkBottom = baseline + ink.actualBoundingBoxDescent;
        if (inkTop < clipTop - 0.5 || inkBottom > clipBottom + 0.5) {
          const cell = label.closest('[data-lab-cell]')?.getAttribute('data-lab-cell');
          problems.push(
            `${cell}: ${text} ink ${inkTop.toFixed(1)}-${inkBottom.toFixed(1)}, clip ${clipTop.toFixed(1)}-${clipBottom.toFixed(1)}`,
          );
        }
      }
      return { problems, count: labels.length };
    });
  expect(clipped.count).toBeGreaterThan(40);
  expect(clipped.problems).toEqual([]);
});

test('UIC-LABS-3.7 the people picker takes the scale at sm, md and lg', async ({ page, lab }) => {
  await lab.open('control-sizes');
  for (const content of ['short', 'long', 'large type']) {
    for (const [size, height] of [
      ['sm', 24],
      ['md', 28],
      ['lg', 32],
    ] as const) {
      const field = matrixCell(page, `content=${content} size=${size}`, {
        family: 'people-picker-sizes',
      }).locator('.ui-combobox__field');
      expect(Math.round(requireDefined(await field.boundingBox()).height)).toBe(height);
    }
  }
});

test('UIC-LABS-3.7 PIN cells are a step larger than the scale and follow it', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const cell = (setting: string, size: string) =>
    page.locator(`[data-lab-pin-sample="${setting}"]`).nth(['xs', 'sm', 'md', 'lg'].indexOf(size));
  const firstBox = async (setting: string, size: string) =>
    requireDefined(await cell(setting, size).locator('.ui-pin-input__cell').first().boundingBox());
  for (const [size, height] of [
    ['xs', 20],
    ['sm', 24],
    ['md', 28],
    ['lg', 32],
  ] as const) {
    for (const setting of ['scale', 'large type']) {
      const box = await firstBox(setting, size);
      expect([Math.round(box.width), Math.round(box.height)]).toEqual([height + 4, height + 8]);
    }
  }
  const overridden = await firstBox('md at 40 pixels', 'md');
  expect([Math.round(overridden.width), Math.round(overridden.height)]).toEqual([44, 48]);
  const narrow = cell('narrow column', 'lg').locator('.ui-pin-input__cell');
  const first = requireDefined(await narrow.first().boundingBox());
  const last = requireDefined(await narrow.last().boundingBox());
  expect(last.y).toBeGreaterThan(first.y);
});
