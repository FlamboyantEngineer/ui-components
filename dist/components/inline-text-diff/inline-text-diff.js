import { jsx as _jsx } from "react/jsx-runtime";
import { Fragment } from 'react';
import { createHooks } from '../../core/hooks.js';
export { createInlineWordDiff } from './text-diff.js';
const hooks = createHooks('inline-text-diff', ['removed', 'added']);
/** A change to a text value, inline: unchanged context, the removed run and the added run. */
export function InlineTextDiff({ segments, className, ...rest }) {
    return (_jsx("span", { ...rest, ...hooks.root({ className }), children: segments.map((segment, index) => {
            if (segment.kind === 'removed') {
                return (_jsx("del", { ...hooks.slot('removed'), children: segment.text }, index));
            }
            if (segment.kind === 'added') {
                return (_jsx("ins", { ...hooks.slot('added'), children: segment.text }, index));
            }
            return _jsx(Fragment, { children: segment.text }, index);
        }) }));
}
//# sourceMappingURL=inline-text-diff.js.map