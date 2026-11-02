import { createHooks } from '../../core/hooks.js';

/** The formula bar's root and slot hooks. */
export const formulaBarHooks = createHooks('formula-bar', [
  'reference',
  'status',
  'cancel',
  'confirm',
  'glyph',
  'functions',
  'editor',
  'result',
]);
