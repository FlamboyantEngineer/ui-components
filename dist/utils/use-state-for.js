import { useState } from 'react';
/**
 * State that belongs to `owner`, such as the comparison a view draws: the value last set while
 * `owner` stays the same object, and `initial` again once it is a different one.
 */
export function useStateFor(owner, initial) {
    const [state, setState] = useState({ owner, value: initial });
    return [state.owner === owner ? state.value : initial, (value) => setState({ owner, value })];
}
//# sourceMappingURL=use-state-for.js.map