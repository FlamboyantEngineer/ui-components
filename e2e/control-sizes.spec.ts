import { expect, test } from './fixtures.js';

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
};

test('UIC-LABS-3.7 every control takes the height of its size, not of its content or type', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const cells = await page.locator('td[data-lab-cell]').evaluateAll(
    (tds, selectors) =>
      tds.map((td) => {
        const address = td.getAttribute('data-lab-cell') ?? '';
        const control = /control=(\S+)/.exec(address)?.[1] ?? '';
        const size = /size=(\S+)/.exec(address)?.[1] ?? '';
        const box = td.querySelector(selectors[control] ?? ':not(*)');
        const scale = getComputedStyle(document.documentElement);
        return {
          address,
          control,
          size,
          height: box ? Math.round(box.getBoundingClientRect().height) : null,
          expected: Number.parseFloat(scale.getPropertyValue(`--ref-control-height-${size}`)),
        };
      }),
    boxes,
  );
  expect(cells.length).toBe(Object.keys(boxes).length * 3 * 4);
  const missing = cells.filter(({ height }) => height === null).map(({ address }) => address);
  expect(missing, 'cells without their control').toEqual([]);
  const wrong = cells
    .filter(({ height, expected }) => height !== null && height !== expected)
    .map(({ address, height, expected }) => `${address}: ${height}px, not ${expected}px`);
  expect(wrong, 'controls off their size').toEqual([]);
  await lab.expectAccessible();
});

test('UIC-LABS-3.7 distinguishes surrounding type and keeps field samples compact', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const large = page.locator('[data-lab-cell="control=button content=large type size=md"]');
  const short = page.locator('[data-lab-cell="control=button content=short size=md"]');
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

test('UIC-LABS-3.7 checkbox and radio groups show independent and exclusive choices', async ({
  page,
  lab,
}) => {
  await lab.open('control-sizes');
  const checkboxes = page.locator(
    '[data-lab-cell="control=choice-group-multiple content=short size=md"]',
  );
  await expect(checkboxes.getByRole('checkbox')).toHaveCount(3);
  await checkboxes.getByRole('checkbox', { name: 'Pear' }).focus();
  await page.keyboard.press('Space');
  await expect(checkboxes.getByRole('checkbox', { name: 'Apple' })).toBeChecked();
  await expect(checkboxes.getByRole('checkbox', { name: 'Pear' })).toBeChecked();
  const radios = page.locator('[data-lab-cell="control=choice-group content=short size=md"]');
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
    const cell = page.locator(`[data-lab-cell="control=combobox content=short size=${size}"]`);
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
  const trigger = page
    .locator('[data-lab-cell="control=dropdown-menu content=short size=md"]')
    .getByRole('button', { name: 'Edit' });
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
    Math.round((await menu.boundingBox())!.y - (await trigger.boundingBox())!.y);
  const offset = await gap();
  const top = await page.evaluate(() => window.scrollY);
  await page.mouse.move(600, 500);
  await page.mouse.wheel(0, 200);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(top);
  await expect(menu).toBeVisible();
  await expect.poll(gap).toBe(offset);
});
