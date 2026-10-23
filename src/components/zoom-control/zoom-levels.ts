const tolerance = 1e-9;

/** Finite zoom percentages in ascending order, without duplicates. */
export function sortZoomLevels(levels: readonly number[]): number[] {
  return [...new Set(levels)].filter(Number.isFinite).sort((a, b) => a - b);
}

/** The nearest index and both step targets of an already normalised ladder. */
export function resolveZoomLevels(levels: readonly number[], value: number) {
  let index = 0;
  let previous: number | undefined;
  let next: number | undefined;
  levels.forEach((level, position) => {
    if (level < value - tolerance) previous = level;
    if (next === undefined && level > value + tolerance) next = level;
    if (Math.abs(level - value) < Math.abs((levels[index] ?? level) - value) - tolerance) {
      index = position;
    }
  });
  return { index, previous, next };
}
