/**
 * The state after a press of a three-state box: unset (`null`, drawn mixed) becomes ticked, ticked
 * becomes empty and empty becomes unset again.
 */
export function cycleCheckState(value: boolean | null): boolean | null {
  if (value === null) return true;
  return value ? false : null;
}
