import { createHooks } from '../../core/hooks.js';

/** The hook classes of the period field family (specs/PERIOD-FIELD.md). */
export const periodFieldHooks = createHooks('period-field', [
  'trigger',
  'value',
  'popover',
  'dialog',
  'picker',
  'picker-header',
  'picker-nav',
  'picker-heading',
  'grid',
  'period',
]);
