import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ToggleButton, ToggleButtonGroup } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { useUiStrings } from '../../core/provider.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import { chartLegendHooks as hooks } from './chart-hooks.js';
/** The hidden series: the caller's when controlled, otherwise the component's own. */
export function useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, }) {
    return useControllableState(hiddenKeys === undefined ? undefined : new Set(hiddenKeys), new Set(defaultHiddenKeys ?? []), onHiddenKeysChange);
}
/**
 * A chart's legend: one toggle button per series, with a swatch in the series' colour slot, that
 * shows or hides the series. The last shown series stays shown. The arrow keys move between items.
 */
export function ChartLegend({ items, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ...rest }) {
    const strings = useUiStrings();
    const [hidden, setHidden] = useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange });
    const shown = items.filter((item) => !hidden.has(item.id)).map((item) => item.id);
    return (_jsx(ToggleButtonGroup, { "aria-label": rest['aria-labelledby'] ? undefined : strings.chartLegend, ...rest, ...hooks.root({ className, props: rest }), selectionMode: "multiple", disallowEmptySelection: true, selectedKeys: shown, onSelectionChange: (keys) => setHidden(new Set(items.filter((item) => !keys.has(item.id)).map((item) => item.id))), children: items.map((item, series) => (_jsxs(ToggleButton, { id: item.id, ...hooks.slot('item', { series, tone: item.tone }), children: [_jsx("span", { ...hooks.slot('swatch', { series, tone: item.tone }), "aria-hidden": "true" }), _jsx("span", { ...hooks.slot('label'), children: item.label })] }, toKeyIdentity(item.id)))) }));
}
//# sourceMappingURL=chart-legend.js.map