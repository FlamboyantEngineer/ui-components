'use client';

import { createContext } from 'react';
import { createHooks } from '../../core/hooks.js';
import type { HeadingLevel } from '../section-header/section-header.js';

/** Where the trigger's indicator sits: before the title (`start`) or after it (`end`). */
export type DisclosureIndicatorPosition = 'start' | 'end';

/** What a disclosure hands its title and panel. */
interface DisclosureParts {
  /** The title's heading level; the panel's content takes the levels below it. */
  level: HeadingLevel;
  indicatorPosition: DisclosureIndicatorPosition;
}

/** The hooks of the disclosure family, shared by its modules. */
export const disclosureHooks = createHooks('disclosure', [
  'header',
  'heading',
  'trigger',
  'indicator',
  'title',
  'panel',
]);

export const disclosureGroupHooks = createHooks('disclosure-group');

/** The enclosing disclosure's heading level and indicator position. */
export const DisclosurePartsContext = createContext<DisclosureParts>({
  level: 3,
  indicatorPosition: 'start',
});
