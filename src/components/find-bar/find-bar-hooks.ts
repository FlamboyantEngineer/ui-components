import { createHooks } from '../../core/hooks.js';

/** The find bar's hooks, which its parts share. */
export const findBarHooks = createHooks('find-bar', [
  'query',
  'navigation',
  'status',
  'previous',
  'next',
  'options',
  'replacement',
  'replace',
  'replace-all',
  'close',
]);
