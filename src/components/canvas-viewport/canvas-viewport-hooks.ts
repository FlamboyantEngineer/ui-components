import { createHooks } from '../../core/hooks.js';

export const canvasViewportHooks = createHooks('canvas-viewport', [
  'surface',
  'world',
  'controls',
  'anchor',
]);
