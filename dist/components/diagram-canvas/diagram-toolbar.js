import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useUiStrings } from '../../core/provider.js';
import { Button } from '../button/button.js';
import { SegmentedChoice } from '../segmented-choice/segmented-choice.js';
import { ZoomControl } from '../zoom-control/zoom-control.js';
import { diagramHooks as hooks } from './diagram-hooks.js';
/** The zoom control and fit button of the canvas, and the switch between canvas and outline. */
export function DiagramToolbar({ controller, view, onViewChange }) {
    const strings = useUiStrings();
    const { viewport, zoomTo, fit } = controller.view;
    return (_jsxs("div", { ...hooks.slot('toolbar'), children: [view === 'canvas' ? (_jsxs(_Fragment, { children: [_jsx(ZoomControl, { className: hooks.slotClass('zoom'), value: viewport.zoom, onChange: (zoom) => zoomTo(zoom), resetValue: 100, formatOptions: { maximumFractionDigits: 0 } }), _jsx(Button, { className: hooks.slotClass('fit'), icon: "expand", label: strings.diagramFit, tooltip: strings.diagramFit, size: "sm", variant: "ghost", isDisabled: controller.nodes.length === 0, onPress: fit })] })) : null, _jsx(SegmentedChoice, { className: hooks.slotClass('view-switch'), "aria-label": strings.diagramView, size: "sm", sizing: "content", options: [
                    { value: 'canvas', label: strings.diagramCanvasView },
                    { value: 'outline', label: strings.diagramOutlineView },
                ], value: view, onChange: (next) => {
                    if (next === 'canvas' || next === 'outline')
                        onViewChange(next);
                } })] }));
}
//# sourceMappingURL=diagram-toolbar.js.map