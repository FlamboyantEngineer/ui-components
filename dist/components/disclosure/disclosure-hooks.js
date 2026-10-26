import { createContext } from 'react';
import { createHooks } from '../../core/hooks.js';
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
export const DisclosurePartsContext = createContext({
    level: 3,
    indicatorPosition: 'start',
});
//# sourceMappingURL=disclosure-hooks.js.map