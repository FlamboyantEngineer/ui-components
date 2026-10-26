import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { createHooks } from '../../core/hooks.js';
import { useUiStrings } from '../../core/provider.js';
import { encodeQr } from '../../utils/encode-qr.js';
const hooks = createHooks('qr-code', ['modules']);
const defaultQuietZone = 4;
const defaultModuleSize = 4;
function wholeOrDefault(value, fallback) {
    return value !== undefined && Number.isFinite(value) && value >= 0 ? Math.trunc(value) : fallback;
}
/** One path for the dark modules: a rectangle per horizontal run, offset by the quiet zone. */
function tracePath(modules, offset) {
    const parts = [];
    modules.forEach((row, y) => {
        let start = -1;
        row.forEach((dark, x) => {
            if (dark && start < 0)
                start = x;
            const isRunEnd = start >= 0 && (!dark || x === row.length - 1);
            if (!isRunEnd)
                return;
            const end = dark ? x + 1 : x;
            parts.push(`M${start + offset} ${y + offset}h${end - start}v1h${start - end}z`);
            start = -1;
        });
    });
    return parts.join('');
}
/**
 * A QR code for `value`, drawn as an SVG image of its dark modules with a quiet zone around them.
 * The host stylesheet colours the modules and the ground; unstyled, they are black on the page.
 */
export function QrCode({ value, errorCorrection = 'medium', quietZone, moduleSize, className, 'aria-label': ariaLabel, ...rest }) {
    const strings = useUiStrings();
    const symbol = useMemo(() => encodeQr(value, { errorCorrection }), [value, errorCorrection]);
    const margin = wholeOrDefault(quietZone, defaultQuietZone);
    const scale = moduleSize !== undefined && Number.isFinite(moduleSize) && moduleSize > 0
        ? moduleSize
        : defaultModuleSize;
    const extent = (symbol?.size ?? 21) + margin * 2;
    const label = symbol ? strings.qrCodeOf(value) : strings.qrCodeTooLong;
    return (_jsx("svg", { ...rest, ...hooks.root({
            className,
            data: { errorCorrection, version: symbol?.version, invalid: symbol === undefined },
        }), role: "img", "aria-label": ariaLabel ?? (rest['aria-labelledby'] ? undefined : label), width: extent * scale, height: extent * scale, viewBox: `0 0 ${extent} ${extent}`, shapeRendering: "crispEdges", focusable: "false", children: symbol ? _jsx("path", { ...hooks.slot('modules'), d: tracePath(symbol.modules, margin) }) : null }));
}
//# sourceMappingURL=qr-code.js.map