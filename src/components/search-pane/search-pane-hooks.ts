import { createHooks } from '../../core/hooks.js';

/** The search pane's hooks, which its find row, result list and messages share. */
export const searchPaneHooks = createHooks('search-pane', [
  'header',
  'replace-toggle',
  'find',
  'message',
  'results',
  'result',
  'result-label',
  'result-description',
  'result-read-only',
  'show-earlier',
  'show-later',
]);

/** A snippet's hooks: the context before the match, the match, the context after and the ellipses. */
export const searchSnippetHooks = createHooks('search-snippet', [
  'lead',
  'near',
  'match',
  'after',
  'ellipsis',
]);
