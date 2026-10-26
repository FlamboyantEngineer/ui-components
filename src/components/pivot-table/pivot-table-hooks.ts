import { createHooks } from '../../core/hooks.js';

export const pivotTableHooks = createHooks('pivot-table', [
  'chooser',
  'field',
  'field-label',
  'aggregate',
  'table',
  'key',
  'value',
]);
