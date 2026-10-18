// The drawing box shared by the charts with axes (specs/CHART.md).

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
export function resolvePlotBox(width: number, height: number, margin: ChartMargin): ChartBox {
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
export function countTicks(length: number, spacing: number): number {
  return Math.max(2, Math.round(length / spacing));
}

/** A coordinate rounded to two decimals, for stable markup. */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}
