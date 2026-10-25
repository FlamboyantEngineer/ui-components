import type { DateTimeFieldDateState } from './date-time-field.js';

interface DateAvailability {
  isDateUnavailable?: ((date: string) => boolean) | undefined;
  getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
}

/** One availability predicate serves typed values, ranges, presets and calendar interaction. */
export function createDateUnavailableCheck(
  options: DateAvailability,
): ((date: string) => boolean) | undefined {
  if (!options.isDateUnavailable && !options.getDateState) return undefined;
  return (date) => {
    const state = options.getDateState?.(date);
    return Boolean(state?.isDisabled || state?.isTaken || options.isDateUnavailable?.(date));
  };
}
