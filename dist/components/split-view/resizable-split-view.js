import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useId, useImperativeHandle, useState } from 'react';
import { useUiStrings } from '../../core/provider.js';
import { useElementSize } from '../../utils/use-element-size.js';
import { useForwardedRef } from '../../utils/use-forwarded-ref.js';
import { resolveContainment } from '../layout/layout.js';
import { ResizeHandle } from './resize-handle.js';
import { applySplitSeparatorValue, isSplitPaneCollapsed, resolveFlexiblePane, resolveSplitPaneBasis, resolveSplitSeparator, } from './split-layout.js';
import { splitViewHooks as hooks } from './styling-hooks.js';
import { useSplitSizes } from './use-split-sizes.js';
/** The names the first two panes publish in `data-pane`. */
const paneNames = ['first', 'second'];
/** The pixels pixel panes take; percent sizes are shares of what they leave. */
function sumPixelSizes(panes, sizes) {
    return panes.reduce((sum, pane, index) => (pane.unit === 'pixel' ? sum + (sizes[index] ?? 0) : sum), 0);
}
/** Separates the props that drive the pane sizes from those the root element takes. */
function splitSizeProps({ sizes, defaultSizes, size, defaultSize, persistKey, onSizesChange, onSizesChangeEnd, onSizeChange, onSizeChangeEnd, onCollapse, onExpand, ...rest }) {
    const changes = { onSizesChange, onSizesChangeEnd, onSizeChange, onSizeChangeEnd };
    const state = { sizes, defaultSizes, size, defaultSize, persistKey, onCollapse, onExpand };
    return [{ ...state, ...changes }, rest];
}
/**
 * The separator between two panes: its value sizes a pixel pane beside it, else the pane before it,
 * and Enter collapses or opens a collapsible pane beside it.
 */
function SeparatorHandle({ index, panes, split, available, length, getLength, ...handle }) {
    const separator = resolveSplitSeparator(panes, split.current, { index, available });
    const fixed = sumPixelSizes(panes, split.current);
    const toggled = [separator.sized, separator.partner].find((pane) => panes[pane]?.collapsible);
    const apply = (value) => applySplitSeparatorValue(panes, split.current, { index, available, value });
    const onKeyDown = (event) => {
        if (event.key !== 'Enter' || toggled === undefined)
            return;
        event.preventDefault();
        const isCollapsed = isSplitPaneCollapsed(panes[toggled], split.current[toggled] ?? 0);
        if (isCollapsed)
            split.expand(toggled);
        else
            split.collapse(toggled);
    };
    return (_jsx(ResizeHandle, { orientation: handle.orientation, value: separator.value, minValue: separator.min, maxValue: separator.max, extent: separator.pixel && length > 0 ? length : 100, sizedPane: separator.sizedPane, getUnitsPerPixel: () => {
            if (separator.pixel)
                return 1;
            const flexible = getLength() - fixed;
            return flexible > 0 ? 100 / flexible : 0;
        }, "aria-label": handle.label, "aria-controls": handle.controls, onResizingChange: handle.onResizingChange, onChange: (value) => split.update(apply(value), 'change'), onChangeEnd: (value) => split.update(apply(value), 'end'), onKeyDown: onKeyDown }));
}
/** A split of two or more panes with a window splitter between each pair. */
export function ResizableSplitView({ children, className, orientation = 'horizontal', panes, separatorLabel, handleRef, grow, fill, clip, ref, ...props }) {
    const strings = useUiStrings();
    const generatedId = useId();
    const [sizeOptions, rest] = splitSizeProps(props);
    const split = useSplitSizes({ panes, ...sizeOptions });
    const [isResizing, setResizing] = useState(false);
    const [root, setRoot] = useForwardedRef(ref);
    const horizontal = orientation === 'horizontal';
    const enabled = panes.some((pane) => pane.unit === 'pixel');
    const measured = useElementSize(root, { box: 'client', enabled });
    const length = (horizontal ? measured?.width : measured?.height) ?? 0;
    // Until the split is measured, pixel panes grow up to their largest size.
    const available = length > 0
        ? Math.max(0, length - sumPixelSizes(panes, split.current))
        : Number.POSITIVE_INFINITY;
    useImperativeHandle(handleRef, () => ({
        collapse: split.collapse,
        expand: split.expand,
        resize: (next) => split.update(next, 'set'),
    }));
    const ids = panes.map((pane, index) => pane.id ?? `${generatedId}-${index}`);
    const flexible = resolveFlexiblePane(panes);
    const containment = resolveContainment({ grow, fill, clip }, { fill: true, clip: true });
    const data = { orientation, resizable: true, resizing: isResizing, ...containment };
    const getLength = () => (horizontal ? root.current?.clientWidth : root.current?.clientHeight) ?? 0;
    const labelOf = (index) => typeof separatorLabel === 'function'
        ? separatorLabel(index)
        : (separatorLabel ?? strings.resize);
    return (_jsx("div", { ...rest, ref: setRoot, ...hooks.root({ className, data }), children: panes.map((pane, index) => (_jsxs(Fragment, { children: [index > 0 ? (_jsx(SeparatorHandle, { index: index - 1, panes: panes, split: split, available: available, orientation: horizontal ? 'vertical' : 'horizontal', length: length, getLength: getLength, label: labelOf(index - 1), controls: `${ids[index - 1]} ${ids[index]}`, onResizingChange: setResizing })) : null, _jsx("div", { ...hooks.slot('pane', {
                        pane: paneNames[index],
                        flexible: index === flexible,
                        collapsed: isSplitPaneCollapsed(pane, split.current[index] ?? 0),
                    }), inert: isSplitPaneCollapsed(pane, split.current[index] ?? 0) && !split.current[index], id: ids[index], style: { flexBasis: resolveSplitPaneBasis(panes, split.current, index) }, children: children[index] })] }, ids[index]))) }));
}
//# sourceMappingURL=resizable-split-view.js.map