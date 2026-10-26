import { useLayoutEffect } from 'react';
import { clamp } from './clamp.js';
import { useElementSize } from './use-element-size.js';
function toPixels(value) {
    return Number.parseFloat(value) || 0;
}
/** Sets the text area's height to its text's, between the given rows, in its own line height. */
function fitRows(area, minRows, maxRows) {
    const style = area.ownerDocument.defaultView?.getComputedStyle(area);
    if (!style)
        return;
    const lineHeight = toPixels(style.lineHeight) || toPixels(style.fontSize) * 1.2 || 16;
    const padding = toPixels(style.paddingTop) + toPixels(style.paddingBottom);
    const border = toPixels(style.borderTopWidth) + toPixels(style.borderBottomWidth);
    const frame = style.boxSizing === 'border-box' ? padding + border : 0;
    area.style.height = '0px';
    const content = clamp(area.scrollHeight - padding, minRows * lineHeight, maxRows * lineHeight);
    area.style.height = `${content + frame}px`;
}
/** Whether a text area grows with its text: when either row limit is set. */
export function isAutoGrowing({ minRows, maxRows }) {
    return minRows !== undefined || maxRows !== undefined;
}
/**
 * Grows a text area with its text between `minRows` and `maxRows` (one row and no limit by default),
 * when either is set. Past `maxRows` the text area scrolls. A new width (a stylesheet or font that
 * loads late, a resized container) wraps the text anew, so it measures again.
 */
export function useAutoGrow(area, options) {
    const { minRows, maxRows, value } = options;
    const isEnabled = isAutoGrowing(options);
    const width = useElementSize(area, { enabled: isEnabled })?.width;
    useLayoutEffect(() => {
        if (isEnabled && area.current)
            fitRows(area.current, minRows ?? 1, maxRows ?? Infinity);
    }, [area, isEnabled, minRows, maxRows, value, width]);
}
//# sourceMappingURL=use-auto-grow.js.map