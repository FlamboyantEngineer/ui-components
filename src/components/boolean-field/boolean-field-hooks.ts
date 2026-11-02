import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the boolean-field family writes (specs/BOOLEAN-FIELD.md). */
export const booleanFieldHooks = createHooks('boolean-field', [
  'switch',
  'caption',
  'form-value',
  'toggle-button',
  'previous',
]);
