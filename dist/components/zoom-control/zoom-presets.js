import { jsx as _jsx } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.js';
/** A menu button whose items request a percentage or report a named preset. */
export function ZoomPresetMenu({ presets = [], onPresetAction, formatter, onRequest, ...trigger }) {
    const strings = useUiStrings();
    if (presets.length === 0)
        return null;
    const items = presets.map((preset) => typeof preset === 'number'
        ? { id: preset, label: formatter.format(preset) }
        : { id: preset.id, label: preset.label });
    return (_jsx(DropdownMenu, { ...trigger, iconOnly: true, icon: "chevron-down", label: strings.zoomPresets, placement: "bottom end", items: items, onAction: (key) => {
            if (typeof key === 'number')
                onRequest(key);
            else
                onPresetAction?.(key);
        } }));
}
//# sourceMappingURL=zoom-presets.js.map