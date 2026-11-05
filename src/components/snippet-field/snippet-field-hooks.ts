import { createHooks } from '../../core/hooks.js';

export const snippetFieldHooks = createHooks('snippet-field', [
  'request',
  'source',
  'line',
  'preview-button',
  'range-error',
  'saved',
  'empty',
  'preview',
  'status',
  'apply',
  'cancel',
]);
