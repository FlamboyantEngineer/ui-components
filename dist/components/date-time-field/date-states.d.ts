import type { DateTimeFieldDateState } from './date-time-field.js';
interface DateAvailability {
    isDateUnavailable?: ((date: string) => boolean) | undefined;
    getDateState?: ((date: string) => DateTimeFieldDateState | undefined) | undefined;
}
/** One availability predicate serves typed values, ranges, presets and calendar interaction. */
export declare function createDateUnavailableCheck(options: DateAvailability): ((date: string) => boolean) | undefined;
export {};
//# sourceMappingURL=date-states.d.ts.map