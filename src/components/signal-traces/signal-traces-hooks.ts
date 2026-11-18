import { createHooks } from '../../core/hooks.js';

/** The hook classes of signal traces (specs/SIGNAL-TRACES.md). */
export const signalTracesHooks = createHooks('signal-traces', [
  'toolbar',
  'zoom-in',
  'zoom-out',
  'reset',
  'range',
  'plot',
  'drawing',
  'channel',
  'label',
  'unit',
  'value-axis',
  'time-axis',
  'envelope',
  'reference',
  'trace',
  'empty',
  'cursor-line',
  'cursor',
  'readout',
  'delta',
]);
