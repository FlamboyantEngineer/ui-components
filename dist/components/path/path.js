import { jsx as _jsx } from "react/jsx-runtime";
import { createHooks } from '../../core/hooks.js';
import { formatPath } from '../../utils/path.js';
import { TruncationTooltip, } from '../truncation-tooltip/truncation-tooltip.js';
const hooks = createHooks('path', ['text']);
/**
 * One line of location text that a stylesheet truncates from the start, keeping the end visible,
 * and that shows the whole path in a tooltip while it is cut.
 */
export function Path({ path, className, ...rest }) {
    const text = typeof path === 'string'
        ? formatPath(path, { rooted: path.trimStart().startsWith('/') })
        : formatPath(path);
    return (_jsx(TruncationTooltip, { ...rest, expandable: false, ...hooks.root({ className, props: rest }), children: _jsx("bdi", { ...hooks.slot('text'), dir: "ltr", children: text }) }));
}
//# sourceMappingURL=path.js.map