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

/**
 * The slider's stops: the levels, with a value between them (or past them) as a stop of its own, so
 * one step from it reaches the neighbouring level on either side, endpoints included, and the
 * value stays where the slider can return to it. `index` is the value's stop.
 */
export function resolveSliderStops(levels: readonly number[], value: number) {
  const onLevel = levels.findIndex((level) => Math.abs(level - value) < tolerance);
  if (onLevel !== -1) return { stops: levels, index: onLevel };
  const after = levels.findIndex((level) => level > value);
  const index = after === -1 ? levels.length : after;
  return { stops: [...levels.slice(0, index), value, ...levels.slice(index)], index };
}

/** The zoom levels, in percent, a control steps through when the caller gives none. */
export const defaultZoomLevels: readonly number[] = [25, 50, 75, 100, 125, 150, 200, 300, 400];

/** Index of the closest level after sorting and deduplicating finite levels; lower wins a tie. */
export function findNearestZoomLevelIndex(levels: readonly number[], value: number): number {
  return resolveZoomLevels(sortZoomLevels(levels), value).index;
}

/**
 * The next level above (`1`) or below (`-1`) `value`, or `undefined` past the last or first level.
 * A value between levels steps to the neighbouring level on that side.
 */
export function findNextZoomLevel(
  levels: readonly number[],
  value: number,
  direction: 1 | -1,
): number | undefined {
  const targets = resolveZoomLevels(sortZoomLevels(levels), value);
  return direction === 1 ? targets.next : targets.previous;
}
