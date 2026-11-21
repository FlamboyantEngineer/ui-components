'use client';

import { prefixDataSlots } from '../../core/data-slot-names.js';
import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the modal family writes (specs/DIALOG.md). */
export const dialogHooks = createHooks(
  'dialog',
  [
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
  ],
  {
    root: 'dialog-overlay',
    panel: 'dialog-content',
    dialog: 'dialog',
    header: 'dialog-header',
    title: 'dialog-title',
    description: 'dialog-description',
    close: 'dialog-close',
    footer: 'dialog-footer',
  },
);

/** The names each presentation gives the family's parts (specs/DIALOG.md UIC-DIALOG-23.2). */
export const dialogSlotNames = {
  dialog: prefixDataSlots([dialogHooks], { from: 'dialog', to: 'dialog' }),
  alertDialog: prefixDataSlots([dialogHooks], { from: 'dialog', to: 'alert-dialog' }),
  sheet: prefixDataSlots([dialogHooks], { from: 'dialog', to: 'sheet' }),
};
