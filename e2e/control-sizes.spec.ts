import { expect, test } from './fixtures.js';

/** The box whose height each control of the control sizes lab takes from its size. */
const boxes: Record<string, string> = {
  button: '.ui-button',
  'icon-button': '.ui-icon-button',
  'dropdown-menu': ':is(.ui-button, .ui-icon-button)',
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
  'checkbox-group': '.ui-checkbox',
  switch: '.ui-switch',
  'radio-group': '.ui-radio__button',
};

/** Controls that offer no `xs` size, whose `xs` cells are empty. */
const withoutXs = ['combobox', 'menubar'];

test('UIC-LABS-3.7 every control takes the height of its size, whatever its content', async ({
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
  expect(cells.length).toBe(Object.keys(boxes).length * 2 * 4);
  const missing = cells
    .filter(({ height }) => height === null)
    .filter(({ control, size }) => !(size === 'xs' && withoutXs.includes(control)))
    .map(({ address }) => address);
  expect(missing, 'cells without their control').toEqual([]);
  const wrong = cells
    .filter(({ height, expected }) => height !== null && height !== expected)
    .map(({ address, height, expected }) => `${address}: ${height}px, not ${expected}px`);
  expect(wrong, 'controls off their size').toEqual([]);
  await lab.expectAccessible();
});
