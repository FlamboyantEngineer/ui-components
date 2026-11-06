// Downsampling a dense line to the values its pixels can show (specs/CHART.md).

/**
 * Keeps, of each pixel column a run of points crosses, its first, lowest, highest and last point,
 * in x order, so the drawn line keeps every column's extremes, the run's ends and each break. Points
 * are kept, never averaged or moved, and the input is left as it is; points sharing an x share a
 * column. The same run always keeps the same points.
 */
export function sampleRun<P extends { x: number; y: number }>(run: readonly P[]): P[] {
  const kept: P[] = [];
  let column: P[] = [];
  let current = Number.NaN;
  const flush = () => {
    const [first] = column;
    if (!first) return;
    let low = first;
    let high = first;
    for (const point of column) {
      if (point.y < low.y) low = point;
      if (point.y > high.y) high = point;
    }
    const chosen = new Set([first, low, high, column.at(-1)]);
    kept.push(...column.filter((point) => chosen.has(point)));
    column = [];
  };
  for (const point of run) {
    const at = Math.floor(point.x);
    if (at !== current) {
      flush();
      current = at;
    }
    column.push(point);
  }
  flush();
  return kept;
}
