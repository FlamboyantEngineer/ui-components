import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button as AriaButton, Input, SearchField } from '../../primitives/index.js';
import { useUiStrings } from '../../core/provider.js';
import { Icon } from '../icon/icon.js';
import { tableHooks as hooks } from './table-hooks.js';
/** The search box above a filterable table. Escape or the clear button empties it. */
export function TableSearch({ label, value, onChange }) {
    const strings = useUiStrings();
    return (_jsxs(SearchField, { "aria-label": label, value: value, onChange: onChange, className: hooks.slotClass('filter'), children: [_jsx(Icon, { glyph: "search", size: "sm", className: hooks.slotClass('filter-icon') }), _jsx(Input, { className: hooks.slotClass('filter-input'), placeholder: label }), _jsx(AriaButton, { className: hooks.slotClass('filter-clear'), "aria-label": strings.clear, children: _jsx(Icon, { glyph: "close", size: "sm" }) })] }));
}
//# sourceMappingURL=table-search.js.map