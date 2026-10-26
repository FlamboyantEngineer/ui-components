// Band scales: categories to evenly spaced bands of a range (specs/SCALES.md).
const defaultPadding = 0.2;
function toFinite(value, fallback) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
/**
 * A band scale that splits a range into one equal step per category, each holding a band with
 * `padding` of the step left empty around it (half on each outer edge), as the bars of a bar
 * chart are laid out. Repeated categories keep their first band.
 */
export function createBandScale(options) {
    const padding = Math.min(1, Math.max(0, toFinite(options.padding, defaultPadding)));
    const range = [toFinite(options.range[0], 0), toFinite(options.range[1], 0)];
    const domain = [...new Set(options.domain)];
    const low = Math.min(...range);
    const length = Math.abs(range[1] - range[0]);
    const step = domain.length > 0 ? length / domain.length : 0;
    const bandwidth = step * (1 - padding);
    const isReversed = range[1] < range[0];
    const indexes = new Map(domain.map((category, index) => [category, index]));
    const map = (category) => {
        const index = indexes.get(category);
        if (index === undefined)
            return Number.NaN;
        const slot = isReversed ? domain.length - 1 - index : index;
        return low + slot * step + (step - bandwidth) / 2;
    };
    return {
        domain,
        range,
        step,
        bandwidth,
        map,
        ticks: () => domain.map((category) => ({
            value: category,
            position: map(category) + bandwidth / 2,
            label: category,
        })),
    };
}
//# sourceMappingURL=band-scale.js.map