import { resolveAmountShares } from '../../utils/resolve-amount-shares.js';
/** Every segment's value and share of the whole, hidden ones included, in linear passes. */
export function toDonutTable(segments, { formats, headings }) {
    const { amounts } = resolveAmountShares(segments, ({ value }) => value);
    return {
        columns: headings,
        rows: amounts.map(({ item, value, share }) => [
            item.label,
            formats.value.format(value),
            formats.share.format(share),
        ]),
    };
}
//# sourceMappingURL=donut-table.js.map