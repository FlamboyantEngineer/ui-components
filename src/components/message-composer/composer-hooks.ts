import { createHooks } from '../../core/hooks.js';

/** The hooks of both composers, plain and rich. */
export const composerHooks = createHooks('message-composer', [
  'banner',
  'attachments',
  'input',
  'placeholder',
  'pill',
  'code-block',
  'footer',
  'toolbar',
  'menu-button',
  'menu',
  'attach',
  'emoji',
  'cancel',
  'action',
  'completions',
]);
