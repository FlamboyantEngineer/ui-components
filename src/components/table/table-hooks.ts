import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the table family writes (specs/TABLE.md). */
export const tableHooks = createHooks('table', [
  'filter',
  'filter-icon',
  'filter-input',
  'filter-clear',
  'scroll',
  'grid',
  'header',
  'column',
  'column-label',
  'sort-icon',
  'resizer',
  'body',
  'row',
  'cell',
  'checkbox',
  'checkbox-box',
  'drag-handle',
  'drop-indicator',
  'state-row',
  'state-cell',
]);
