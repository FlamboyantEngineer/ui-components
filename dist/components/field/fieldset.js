import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { FieldScopeContext, useFieldScope } from './field-scope.js';
const hooks = createHooks('fieldset', ['legend']);
/**
 * Groups fields under a legend on a native `<fieldset>`. Disabling it disables every field inside:
 * their state refuses changes as well as their native controls.
 */
export function Fieldset({ legend, isDisabled = false, className, children, ...rest }) {
    const parent = useFieldScope();
    const isGroupDisabled = Boolean(parent.isDisabled || isDisabled);
    const scope = useMemo(() => ({ ...parent, isDisabled: isGroupDisabled }), [parent, isGroupDisabled]);
    return (_jsxs("fieldset", { ...rest, ...hooks.root({ className, props: rest, data: { disabled: isGroupDisabled } }), disabled: isDisabled || undefined, children: [legend ? _jsx("legend", { ...hooks.slot('legend'), children: legend }) : null, _jsx(FieldScopeContext.Provider, { value: scope, children: children })] }));
}
//# sourceMappingURL=fieldset.js.map