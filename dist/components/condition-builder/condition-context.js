import { createContext, useContext } from 'react';
import { createHooks } from '../../core/hooks.js';
export const conditionBuilderHooks = createHooks('condition-builder', [
    'group',
    'group-header',
    'combinator',
    'rules',
    'item',
    'rule',
    'field',
    'operator',
    'value',
    'message',
    'actions',
    'empty',
    'group-actions',
    'add-rule',
    'add-group',
]);
export const ConditionBuilderContext = createContext(null);
/** The builder a rule or a group belongs to. */
export function useConditionBuilder() {
    const value = useContext(ConditionBuilderContext);
    if (!value)
        throw new Error('A condition rule or group renders inside a ConditionBuilder.');
    return value;
}
//# sourceMappingURL=condition-context.js.map