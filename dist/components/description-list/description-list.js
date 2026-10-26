import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocale } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { formatDescriptionValue, } from './format-description-value.js';
const hooks = createHooks('description-list', ['row', 'label', 'value', 'secondary']);
/** Read-only label and value pairs in a native description list. */
export function DescriptionList({ children, layout = 'inline', columns = 1, className, ...rest }) {
    return (_jsx("dl", { ...rest, ...hooks.root({ className, data: { layout, columns } }), children: children }));
}
/** One term with its value and an optional second definition, grouped in a `<div>`. */
export function DescriptionRow({ label, children, value, formatOptions, secondary, span = 1, className, ...rest }) {
    const { locale } = useLocale();
    const shown = children === undefined && value !== undefined
        ? formatDescriptionValue(value, { locale, formatOptions })
        : children;
    return (_jsxs("div", { ...rest, ...hooks.slot('row', { span }, className), children: [_jsx("dt", { ...hooks.slot('label'), children: label }), _jsx("dd", { ...hooks.slot('value'), children: shown }), isEmptyNode(secondary) ? null : _jsx("dd", { ...hooks.slot('secondary'), children: secondary })] }));
}
//# sourceMappingURL=description-list.js.map