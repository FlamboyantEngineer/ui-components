import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the code-editor family writes (specs/CODE-EDITOR.md). */
export const codeEditorHooks = createHooks('code-editor', [
  'format',
  'toolbar',
  'surface',
  'gutter',
  'line',
  'line-number',
  'line-text',
  'code',
  'highlight',
  'token',
  'mark',
  'match',
  'bracket',
  'caret',
  'input',
  'diagnostics',
  'diagnostic',
  'announcement',
  'tooltip',
  'popover',
  'search',
  'scrollbars',
  'scroll-marker',
]);
