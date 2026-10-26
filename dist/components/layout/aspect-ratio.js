import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
const hooks = createHooks('aspect-ratio');
/** A box whose height the stylesheet derives from its width, for media and embedded frames. */
export function AspectRatio({ ratio = '1-1', children, className, ...rest }) {
    return (_jsx("div", { ...rest, ...hooks.root({ className, data: { ratio } }), children: children }));
}
//# sourceMappingURL=aspect-ratio.js.map