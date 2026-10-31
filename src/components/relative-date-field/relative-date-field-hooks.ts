import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the relative-date-field family writes (specs/RELATIVE-DATE-FIELD.md). */
export const relativeDateFieldHooks = createHooks('relative-date-field', [
  'select',
  'trigger',
  'value',
  'chevron',
  'popover',
  'listbox',
  'option',
  'preview',
  'calendar',
]);
