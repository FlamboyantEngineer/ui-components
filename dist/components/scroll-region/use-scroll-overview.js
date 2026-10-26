import { useEffect, useMemo, useState } from 'react';
import { buildScrollOverviewImage, resolveLayeredScrollOverviewSegments, } from '../../utils/scroll-overview.js';
import { observeViewport } from './observe-viewport.js';
/**
 * Measures the viewport's visible and content heights and turns the markers into an overview image.
 * It paints only: scrolling, the native scrollbar and its hit testing are untouched. Observers and the
 * pending frame are released when the markers go away or the region unmounts.
 */
export function useScrollOverview(viewport, { markers, layers, enabled }) {
    const activeLayers = useMemo(() => {
        if (!enabled)
            return [];
        return layers ?? (markers ? [{ name: 'markers', markers }] : []);
    }, [enabled, layers, markers]);
    const hasMarkers = activeLayers.some((layer) => layer.markers.length > 0);
    const [metrics, setMetrics] = useState({ height: 0, scrollHeight: 0 });
    useEffect(() => {
        const element = viewport.current;
        const view = element?.ownerDocument.defaultView;
        if (!element || !view || !hasMarkers)
            return undefined;
        const measure = () => {
            const next = { height: element.clientHeight, scrollHeight: element.scrollHeight };
            setMetrics((previous) => previous.height === next.height && previous.scrollHeight === next.scrollHeight
                ? previous
                : next);
        };
        return observeViewport(element, view, { measure }).disconnect;
    }, [activeLayers, hasMarkers, viewport]);
    const image = useMemo(() => hasMarkers
        ? buildScrollOverviewImage(resolveLayeredScrollOverviewSegments(activeLayers, metrics.height, metrics.scrollHeight), metrics.height)
        : 'none', [activeLayers, hasMarkers, metrics.height, metrics.scrollHeight]);
    return { visible: hasMarkers && image !== 'none', image, height: metrics.height };
}
//# sourceMappingURL=use-scroll-overview.js.map