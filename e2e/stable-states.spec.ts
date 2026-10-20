import { expect, test } from './fixtures.js';

/**
 * Labs whose state matrices show one value through every state, so each cell of a row of states
 * must keep the size of the first. Each lab names the states whose cells show other content, and
 * the matrices whose axes vary the content.
 */
const labs: Record<string, { contentStates?: string[]; contentAxes?: string[] }> = {
  'action-button': {},
  'boolean-field': {},
  'checkbox-group': {},
  'color-field': {},
  'date-time-field': {},
  field: {},
  'icon-select-field': {},
  'inline-edit': {},
  'json-editor': { contentStates: ['read-only'] },
  link: { contentStates: ['new tab'] },
  'load-more': {},
  'number-field': {},
  'pin-input': {},
  'radio-group': {},
  'relative-date-field': {},
  'select-field': { contentAxes: ['mode'] },
  slider: {},
  'text-field': {},
  tooltip: {},
  'tree-select-field': {},
};

for (const [name, { contentStates = [], contentAxes = [] }] of Object.entries(labs)) {
  test(`UIC-LABS-3.6 ${name} keeps its size through its states`, async ({ page, lab }) => {
    await lab.open(name);
    const shifts = await page.locator('table[data-lab-matrix]').evaluateAll(
      (tables, skip) =>
        tables.flatMap((table) => {
          const axes = (table.getAttribute('data-lab-matrix') ?? '').split(' ');
          if (!axes.includes('state') || axes.some((axis) => skip.axes.includes(axis))) return [];
          const rows = new Map<string, { state: string; width: number; height: number }[]>();
          for (const cell of table.querySelectorAll('td[data-lab-cell]')) {
            const address = cell.getAttribute('data-lab-cell') ?? '';
            const state = /(?:^| )state=(.+?)(?= \w+=|$)/.exec(address)?.[1] ?? '';
            const box = cell.firstElementChild?.getBoundingClientRect();
            if (!box || skip.states.includes(state)) continue;
            const key = address.replace(`state=${state}`, '').trim();
            const { width, height } = box;
            rows.set(key, [...(rows.get(key) ?? []), { state, width, height }]);
          }
          const size = ({ width, height }: { width: number; height: number }) =>
            `${Math.round(width)}x${Math.round(height)}`;
          return [...rows].flatMap(([key, [first, ...cells]]) =>
            first
              ? cells
                  .filter(
                    (cell) =>
                      Math.abs(cell.width - first.width) > 1 ||
                      Math.abs(cell.height - first.height) > 1,
                  )
                  .map(
                    (cell) =>
                      `${key}: ${first.state} ${size(first)} -> ${cell.state} ${size(cell)}`,
                  )
              : [],
          );
        }),
      { states: contentStates, axes: contentAxes },
    );
    expect(shifts, 'state cells that change size').toEqual([]);
  });
}
