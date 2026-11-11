import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the cascader field writes (specs/CASCADER-FIELD.md). */
export const cascaderFieldHooks = createHooks('cascader-field', [
  'trigger',
  'value',
  'segment',
  'separator',
  'popover',
  'dialog',
  'panels',
  'panel',
  'listbox',
  'option',
  'option-icon',
  'option-label',
  'option-description',
  'option-shortcut',
  'branch-icon',
  'status',
  'retry',
]);
