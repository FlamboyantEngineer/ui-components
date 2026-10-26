import { jsx as _jsx } from "react/jsx-runtime";
import { Group } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
const hooks = createHooks('button-group');
/**
 * A labelled cluster of related buttons (`role="group"`): spaced or attached,
 * in a row or a column. Each button keeps its own tab stop; a row that should be one tab stop with
 * arrow-key focus is a toolbar.
 */
export function ButtonGroup({ orientation = 'horizontal', density = 'regular', justified = false, className, ...rest }) {
    return (_jsx(Group, { ...rest, ...hooks.root({ className, props: rest, data: { orientation, density, justified } }) }));
}
//# sourceMappingURL=button-group.js.map