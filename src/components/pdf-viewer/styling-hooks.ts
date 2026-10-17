import { createHooks } from '../../core/hooks.js';

/** The viewer's hook classes, shared by the modules that draw its parts. */
export const pdfViewerHooks = createHooks('pdf-viewer', [
  'toolbar',
  'group',
  'page-field',
  'page-label',
  'page-input',
  'page-total',
  'search-field',
  'search-input',
  'search-clear',
  'search-status',
  'actions',
  'stage',
  'scroller',
  'pages',
  'page',
  'canvas',
  'text-layer',
  'match',
]);
