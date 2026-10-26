import { measuredProperty } from '../../core/hooks.js';
import { resolveAmountShares } from '../../utils/resolve-amount-shares.js';
/** The whole and each segment's geometry, preserving shares when the sum overflows. */
export function resolveSegmentedBar(segments, total) {
    const resolved = resolveAmountShares(segments, (segment) => segment.value, total);
    let start = 0;
    return {
        total: resolved.total,
        segments: resolved.amounts.map(({ item, value, share }) => {
            const part = { segment: item, value, share: share * 100, start };
            start += part.share;
            return part;
        }),
    };
}
/** Unitless geometry quantities let the host choose its own sequential animation timing. */
export function toSegmentProperties({ share, start }) {
    return {
        ...measuredProperty('segment-share', String(share)),
        ...measuredProperty('segment-start', String(start)),
    };
}
//# sourceMappingURL=segmented-layout.js.map