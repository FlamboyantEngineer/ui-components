import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId, useMemo } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { useControllableState } from '../../core/controllable-state.js';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { ZoomPresetMenu } from './zoom-presets.js';
import { resolveZoomLevels, sortZoomLevels } from './zoom-levels.js';
/** The zoom levels, in percent, a control steps through when the caller gives none. */
export const defaultZoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];
// Levels and values are compared with a tolerance, so floating-point zoom values match their level.
const tolerance = 1e-9;
const hooks = createHooks('zoom-control', [
    'zoom-out',
    'slider',
    'zoom-in',
    'value',
    'presets',
    'reset',
]);
function useZoomFormatter(formatOptions) {
    return useNumberFormatter({
        style: 'unit',
        unit: 'percent',
        maximumFractionDigits: 20,
        ...formatOptions,
    });
}
/** A built-in button that requests its target zoom, disabled but focusable while it has none. */
function ZoomButton({ slot, icon, label, target, size, isDisabled, onRequest }) {
    return (_jsx(Button, { className: hooks.slotClass(slot), icon: icon, label: label, size: size, isDisabled: isDisabled || target === undefined, focusableWhenDisabled: !isDisabled, onPress: () => {
            if (target !== undefined)
                onRequest(target);
        } }));
}
/**
 * A native range input over the level indices. One step from a value between levels requests the
 * neighbouring level on that side, as the step buttons do, rather than skipping it.
 */
function ZoomSlider({ id, levels, targets, valueText, isDisabled, onRequest }) {
    const { index, previous, next } = targets;
    const strings = useUiStrings();
    return (_jsx("input", { ...hooks.slot('slider'), id: id, type: "range", min: 0, max: Math.max(0, levels.length - 1), step: 1, value: index, disabled: isDisabled, "aria-label": strings.zoomLevel, "aria-valuetext": valueText, onChange: (event) => {
            const position = Number.parseInt(event.currentTarget.value, 10);
            const step = { [index - 1]: previous, [index + 1]: next }[position];
            const level = step ?? levels[position];
            if (level !== undefined)
                onRequest(level);
        } }));
}
/** Index of the closest level after sorting and deduplicating finite levels; lower wins a tie. */
export function findNearestZoomLevelIndex(levels, value) {
    return resolveZoomLevels(sortZoomLevels(levels), value).index;
}
/**
 * The next level above (`1`) or below (`-1`) `value`, or `undefined` past the last or first level.
 * A value between levels steps to the neighbouring level on that side.
 */
export function findNextZoomLevel(levels, value, direction) {
    const targets = resolveZoomLevels(sortZoomLevels(levels), value);
    return direction === 1 ? targets.next : targets.previous;
}
/**
 * Zoom out, a slider over the zoom levels, zoom in and the current percentage, in one named group,
 * with an optional reset button.
 */
export function ZoomControl({ levels = defaultZoomLevels, value, defaultValue = 100, onChange, resetValue, isDisabled = false, zoomOutButton, zoomInButton, formatOptions, size = 'sm', presets, onPresetAction, 'aria-label': ariaLabel, className, ...rest }) {
    const strings = useUiStrings();
    const sliderId = useId();
    const [current, request] = useControllableState(value, defaultValue, onChange);
    const sorted = useMemo(() => sortZoomLevels(levels), [levels]);
    const targets = resolveZoomLevels(sorted, current);
    const formatter = useZoomFormatter(formatOptions);
    const valueText = formatter.format(current);
    const buttonProps = { size, isDisabled, onRequest: request };
    return (_jsxs("div", { ...rest, ...hooks.root({ className, props: rest, data: { size, disabled: isDisabled } }), role: "group", "aria-label": ariaLabel ?? (rest['aria-labelledby'] ? undefined : strings.zoom), children: [zoomOutButton ?? (_jsx(ZoomButton, { ...buttonProps, slot: "zoom-out", icon: "minus", label: strings.zoomOut, target: targets.previous })), _jsx(ZoomSlider, { id: sliderId, levels: sorted, targets: targets, valueText: valueText, isDisabled: isDisabled, onRequest: request }), zoomInButton ?? (_jsx(ZoomButton, { ...buttonProps, slot: "zoom-in", icon: "plus", label: strings.zoomIn, target: targets.next })), _jsx("output", { ...hooks.slot('value'), htmlFor: sliderId, children: valueText }), _jsx(ZoomPresetMenu, { ...buttonProps, className: hooks.slotClass('presets'), presets: presets, onPresetAction: onPresetAction, formatter: formatter }), resetValue === undefined ? null : (_jsx(ZoomButton, { ...buttonProps, slot: "reset", icon: "restore", label: strings.resetZoom, target: Math.abs(current - resetValue) < tolerance ? undefined : resetValue }))] }));
}
//# sourceMappingURL=zoom-control.js.map