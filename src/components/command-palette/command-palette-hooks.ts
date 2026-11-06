import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the command palette writes (specs/COMMAND-PALETTE.md). */
export const commandPaletteHooks = createHooks('command-palette', [
  'panel',
  'dialog',
  'page',
  'back',
  'page-title',
  'search',
  'search-icon',
  'search-input',
  'empty',
]);
