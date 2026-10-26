import { summarizeNumbers } from '../../utils/summarize-numbers.js';
import { useUiStrings } from '../../core/provider.js';
/** The text that describes drawn values: how many series and values, and the lowest and highest. */
export function useValueSummary({ values, series, format }) {
    const strings = useUiStrings();
    const summary = summarizeNumbers(values);
    if (summary.count === 0)
        return strings.noData;
    return strings.chartSummary({
        series,
        values: summary.count,
        low: format.format(summary.min),
        high: format.format(summary.max),
    });
}
//# sourceMappingURL=chart-summary.js.map