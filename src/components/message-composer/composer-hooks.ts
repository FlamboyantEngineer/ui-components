import { createHooks } from '../../core/hooks.js';

/** The hooks of both composers, plain and rich. */
export const composerHooks = createHooks('message-composer', [
  'banner',
  'attachments',
  'input',
  'placeholder',
  'pill',
  'pill-icon',
  'code-block',
  'footer',
  'start',
  'end',
  'menu-button',
  'menu',
  'attach',
  'emoji',
  'select',
  'select-menu',
  'toggle',
  'cancel',
  'action',
  'completions',
]);
