import { createHooks } from '../../core/hooks.js';

export const hooks = createHooks('state-machine-view', [
  'state',
  'state-label',
  'initial-marker',
  'viewport',
  'content',
  'state-row',
  'state-position',
  'routes',
  'route',
  'connector',
  'arrow',
  'transition-label',
]);
