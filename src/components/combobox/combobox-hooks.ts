import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the combobox family writes (specs/COMBOBOX.md). */
export const comboboxHooks = createHooks('combobox', [
  'field',
  'entry',
  'search-icon',
  'input',
  'spinner',
  'clear',
  'button',
  'chips',
  'chip-icon',
  'popover',
  'listbox',
  'section',
  'section-header',
  'option',
  'option-icon',
  'option-label',
  'option-description',
  'create',
  'load-more',
  'empty',
  'list-header',
  'label',
  'description',
  'error',
]);
