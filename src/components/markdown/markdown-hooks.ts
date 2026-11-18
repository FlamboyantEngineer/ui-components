import { createHooks } from '../../core/hooks.js';

export const markdownHooks = createHooks('markdown', [
  'code-block',
  'code',
  'table',
  'task',
  'image',
  'image-link',
]);
