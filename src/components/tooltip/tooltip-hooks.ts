import { createHooks } from '../../core/hooks.js';

/** The hook classes every module of the tooltip family writes (specs/TOOLTIP.md). */
export const tooltipHooks = createHooks('tooltip', ['arrow', 'content']);
