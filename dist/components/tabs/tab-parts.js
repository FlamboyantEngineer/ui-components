import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Glyph, useUiStrings } from '../../core/provider.js';
import { formatCount } from '../../utils/count.js';
import { tabsHooks as hooks } from './tab-hooks.js';
/** A tab's shown count, and the hidden description that gives the full count. */
export function TabCount({ id, count, countMax, countLabel }) {
    const strings = useUiStrings();
    return (_jsxs(_Fragment, { children: [' ', _jsx("span", { ...hooks.slot('count'), children: formatCount(count, { max: countMax }) }), _jsx("span", { id: id, hidden: true, children: countLabel ?? strings.itemCount(count) })] }));
}
/**
 * The close mark of a removable tab. It takes pointer presses only, without selecting the tab;
 * keyboard users press Delete on the focused tab, which the tab announces in `aria-keyshortcuts`.
 */
export function TabRemoveMark({ onRemove }) {
    const stop = (event) => event.stopPropagation();
    return (_jsx("span", { ...hooks.slot('remove'), "aria-hidden": "true", onPointerDown: stop, onPointerUp: stop, onDoubleClick: stop, onMouseDown: (event) => {
            // Closing a tab neither selects nor focuses it.
            event.preventDefault();
            stop(event);
        }, onClick: (event) => {
            stop(event);
            onRemove();
        }, children: _jsx(Glyph, { name: "close" }) }));
}
/** Joins element ids for an ARIA reference list. */
export function joinIds(...ids) {
    return ids.filter(Boolean).join(' ');
}
//# sourceMappingURL=tab-parts.js.map