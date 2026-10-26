/** A drawn segment: its position among the chart's segments and its value. */
export interface DonutGeometryValue {
    series: number;
    value: number;
}
export interface DonutGeometryInput {
    /** The segments drawn, without the hidden ones. */
    values: readonly DonutGeometryValue[];
    /** The outer diameter, in pixels. */
    diameter: number;
}
/** One drawn slice. */
export interface DonutSlice {
    key: string;
    series: number;
    /** Its position among the drawn slices. */
    index: number;
    value: number;
    /** Its share of the total, from 0 to 1. */
    share: number;
    /** Path data of the ring segment. */
    path: string;
}
export interface DonutGeometry {
    slices: DonutSlice[];
    /** The sum of the drawn values. */
    total: number;
}
/**
 * Lays segments out around a ring, clockwise from the top, each spanning its share of the total.
 * Values that are not finite, positive numbers draw no slice. Coordinates are rounded to two
 * decimals.
 */
export declare function resolveDonutGeometry({ values, diameter }: DonutGeometryInput): DonutGeometry;
//# sourceMappingURL=donut-geometry.d.ts.map