import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the progress-bar family writes (specs/PROGRESS-BAR.md). */
export const progressBarHooks = createHooks(
  'progress-bar',
  ['ring', 'track', 'fill', 'label', 'value', 'segment'],
  {
    root: 'progress',
    label: 'progress-label',
    value: 'progress-value',
    track: 'progress-track',
    fill: 'progress-indicator',
  },
);

/** The hook classes of the meter (specs/PROGRESS-BAR.md). */
export const meterHooks = createHooks('meter', [
  'ring',
  'track',
  'fill',
  'label',
  'value',
  'description',
]);
