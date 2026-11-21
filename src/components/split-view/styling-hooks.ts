import { createHooks } from '../../core/hooks.js';

/** The styling hooks of a split view, shared by its fixed and resizable forms. */
export const splitViewHooks = createHooks('split-view', ['pane'], {
  root: 'resizable-panel-group',
  pane: 'resizable-panel',
});
