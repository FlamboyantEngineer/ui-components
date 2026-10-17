/** `value` limited to the inclusive range from `min` to `max`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
