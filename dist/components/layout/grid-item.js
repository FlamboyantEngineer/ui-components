import { createElement } from 'react';
import { createHooks } from '../../core/hooks.js';
const hooks = createHooks('grid-item');
/** One cell of a `Grid` that covers several columns or starts after empty ones. */
export function GridItem({ as, children, className, span = 1, offset = 0, ...rest }) {
    return createElement(as ?? 'div', { ...rest, ...hooks.root({ className, data: { span, offset } }) }, children);
}
//# sourceMappingURL=grid-item.js.map