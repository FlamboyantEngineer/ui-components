import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the event timeline writes (specs/EVENT-TIMELINE.md). */
export const eventTimelineHooks = createHooks('event-timeline', [
  'label',
  'plot',
  'lane',
  'event',
  'event-label',
  'axis',
  'tick',
  'tick-label',
  'unit',
  'empty',
  'details',
  'details-label',
  'details-list',
  'details-body',
  'table',
]);
