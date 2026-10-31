import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the record-label family writes (specs/RECORD-LABEL.md). */
export const recordLabelHooks = createHooks('record-label', [
  'label',
  'preview',
  'header',
  'version',
  'type',
  'state',
  'name',
  'remove',
  'identity',
  'icon',
  'identifier',
  'accessible-label',
]);
