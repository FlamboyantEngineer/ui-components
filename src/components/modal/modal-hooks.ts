import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the modal family writes (specs/MODAL.md). */
export const modalHooks = createHooks('modal', [
  'panel',
  'dialog',
  'body',
  'footer',
  'footer-content',
  'message',
  'actions',
  'cancel',
  'secondary',
  'primary',
  'confirmation-icon',
  'header',
  'heading',
  'title',
  'description',
  'header-actions',
  'close',
]);
