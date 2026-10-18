import type { TableRow } from './table-rows.js';
import type { TableGridOptions } from './use-table-grid.js';

/** The props a `Table` hands to React Aria's table as they are: labelling, selection and expansion. */
export type TableAriaProps = Pick<TableGridOptions<TableRow>, (typeof ariaKeys)[number]>;

const ariaKeys = [
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-details',
  'selectionMode',
  'selectionBehavior',
  'selectedKeys',
  'defaultSelectedKeys',
  'onSelectionChange',
  'disabledKeys',
  'disallowEmptySelection',
  'expandedKeys',
  'defaultExpandedKeys',
  'onExpandedChange',
] as const satisfies readonly (keyof TableGridOptions<TableRow>)[];

/** The props of a `Table` that React Aria's table takes, such as selection and labelling. */
export function pickAriaProps<T extends TableRow>(options: TableGridOptions<T>): TableAriaProps {
  const entries = ariaKeys.map((key) => [key, options[key]] as const);
  return Object.fromEntries(entries.filter(([, value]) => value !== undefined)) as TableAriaProps;
}
