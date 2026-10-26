/** Space around the plotted area for the axes' labels, in pixels. */
export interface ChartMargin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/** The plotted area's edges inside the drawing, in pixels. */
export interface ChartBox {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
/** The plotted area of a `width` by `height` drawing inside `margin`, never inside out. */
export declare function resolvePlotBox(width: number, height: number, margin: ChartMargin): ChartBox;
/** About one tick per `spacing` pixels of axis, and never fewer than two. */
export declare function countTicks(length: number, spacing: number): number;
/** A coordinate rounded to two decimals, for stable markup. */
export declare function roundCoordinate(value: number): number;
//# sourceMappingURL=chart-layout.d.ts.map