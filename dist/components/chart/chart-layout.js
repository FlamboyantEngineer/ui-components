// The drawing box shared by the charts with axes (specs/CHART.md).
/** The plotted area of a `width` by `height` drawing inside `margin`, never inside out. */
export function resolvePlotBox(width, height, margin) {
    const left = Math.min(margin.left, width);
    const top = Math.min(margin.top, height);
    return {
        top,
        left,
        right: Math.max(left, width - margin.right),
        bottom: Math.max(top, height - margin.bottom),
    };
}
/** About one tick per `spacing` pixels of axis, and never fewer than two. */
export function countTicks(length, spacing) {
    return Math.max(2, Math.round(length / spacing));
}
/** A coordinate rounded to two decimals, for stable markup. */
export function roundCoordinate(value) {
    return Math.round(value * 100) / 100;
}
//# sourceMappingURL=chart-layout.js.map