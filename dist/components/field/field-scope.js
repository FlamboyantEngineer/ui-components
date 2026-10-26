// What an enclosing form or fieldset gives the fields inside it.
import { createContext, useContext } from 'react';
/** The scope of the nearest form or fieldset; empty outside both. */
export const FieldScopeContext = createContext({});
export function useFieldScope() {
    return useContext(FieldScopeContext);
}
//# sourceMappingURL=field-scope.js.map