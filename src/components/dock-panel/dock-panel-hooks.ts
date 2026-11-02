import { createHooks } from '../../core/hooks.js';

/** The hooks of the dock panel family, shared by its modules. */
export const dockPanelHooks = createHooks('dock-panel', [
  'tabs',
  'header',
  'strip',
  'tab-list',
  'tab',
  'launchers',
  'launcher',
  'launcher-icon',
  'launcher-label',
  'count',
  'fade',
  'toggle',
  'handle',
  'body',
  'panes',
  'drawer',
  'drawer-body',
  'pane',
  'actions',
  'content',
  'footer',
]);
