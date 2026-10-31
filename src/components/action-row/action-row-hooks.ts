import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the action-row family writes (specs/ACTION-ROW.md). */
export const actionRowHooks = createHooks('action-row', [
  'selection',
  'clear',
  'count',
  'lead',
  'actions',
  'action',
  'overflow',
]);
