/** One availability predicate serves typed values, ranges, presets and calendar interaction. */
export function createDateUnavailableCheck(options) {
    if (!options.isDateUnavailable && !options.getDateState)
        return undefined;
    return (date) => {
        const state = options.getDateState?.(date);
        return Boolean(state?.isDisabled || state?.isTaken || options.isDateUnavailable?.(date));
    };
}
//# sourceMappingURL=date-states.js.map