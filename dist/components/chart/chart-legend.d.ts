import type { Ref } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, Key } from '../../core/props.js';
import type { ChartSeries } from './chart.js';
/** Which series a chart hides, controlled or not. */
export interface ChartHiddenKeysProps {
    /** The hidden series, controlled. */
    hiddenKeys?: Iterable<Key> | undefined;
    /** The series hidden at first, uncontrolled. */
    defaultHiddenKeys?: Iterable<Key> | undefined;
    /** Called with the hidden series after the reader shows or hides one. */
    onHiddenKeysChange?: ((keys: Set<Key>) => void) | undefined;
}
export interface ChartLegendProps extends BaseProps, AriaLabellingProps, ChartHiddenKeysProps {
    /** The series, in the order of their colour slots. */
    items: readonly ChartSeries[];
    /** The group element. */
    ref?: Ref<HTMLDivElement> | undefined;
}
/** The hidden series: the caller's when controlled, otherwise the component's own. */
export declare function useHiddenKeys({ hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, }: ChartHiddenKeysProps): [ReadonlySet<Key>, (keys: Set<Key>) => void];
/**
 * A chart's legend: one toggle button per series, with a swatch in the series' colour slot, that
 * shows or hides the series. The last shown series stays shown. The arrow keys move between items.
 */
export declare function ChartLegend({ items, hiddenKeys, defaultHiddenKeys, onHiddenKeysChange, className, ...rest }: ChartLegendProps): import("react").JSX.Element;
//# sourceMappingURL=chart-legend.d.ts.map