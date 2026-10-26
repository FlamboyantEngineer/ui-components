import { type FocusEvent, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from 'react';
import type { Tone } from '../../core/props.js';
/** A drawn value a reader can focus: its series' position and its position along the series. */
export interface ChartPoint {
    key: string;
    series: number;
    index: number;
}
/** The props a drawn value's element takes to join the chart's focus order and tooltip. */
export interface ChartPointProps {
    ref: (element: SVGElement | null) => void;
    tabIndex: number;
    onFocus: (event: FocusEvent<SVGElement>) => void;
    onBlur: () => void;
    onPointerEnter: (event: PointerEvent<SVGElement>) => void;
    onPointerLeave: () => void;
    onKeyDown: (event: KeyboardEvent<SVGElement>) => void;
}
export interface ChartPoints {
    /** The value whose tooltip shows, while one is hovered or focused. */
    activeKey: string | null;
    /** The element the tooltip points at. */
    anchor: RefObject<SVGElement | null>;
    getPointProps: (point: ChartPoint) => ChartPointProps;
}
/**
 * One tab stop for a chart's drawn values: the arrow keys move along a series (across the
 * categories) and between series, Home and End jump to a series' ends, and the value hovered or
 * focused shows the tooltip until the pointer leaves, focus moves on or Escape is pressed.
 * `isVertical` runs the categories down, as the bars of a horizontal bar chart do.
 */
export declare function useChartPoints(points: readonly ChartPoint[], isVertical?: boolean): ChartPoints;
export interface ChartTooltipProps {
    /** The value whose tooltip shows; `null` hides it. */
    activeKey: string | null;
    anchor: RefObject<SVGElement | null>;
    /** Where the value sits on the other axis: its category or date. */
    title?: string | undefined;
    /** The series' name, beside a swatch in its colour slot. */
    label: string;
    series: number;
    tone: Tone | undefined;
    /** The formatted value. */
    value: ReactNode;
}
/** The tooltip of the hovered or focused value, pointing at its element. */
export declare function ChartTooltip({ activeKey, anchor, title, label, series, tone, value, }: ChartTooltipProps): import("react").JSX.Element;
//# sourceMappingURL=chart-points.d.ts.map