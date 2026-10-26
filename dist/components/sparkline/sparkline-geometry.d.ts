/** A value the sparkline can mark. */
export type SparklineMarker = 'min' | 'max' | 'last';
/** A drawn value: its index in the series and where it sits in the box. */
export interface SparklinePoint {
    index: number;
    value: number;
    x: number;
    y: number;
}
export interface SparklineGeometryInput {
    values: readonly number[];
    width: number;
    height: number;
    /** The value at the bottom edge. Defaults to the lowest value. */
    minValue?: number | undefined;
    /** The value at the top edge. Defaults to the highest value. */
    maxValue?: number | undefined;
}
export interface SparklineGeometry {
    /** Path data of the line: one subpath per run of finite values. */
    line: string;
    /** Path data of the area between each run and the baseline. */
    area: string;
    /** The first lowest, the first highest and the last finite values; empty without any. */
    points: Partial<Record<SparklineMarker, SparklinePoint>>;
}
/**
 * Lays out a series in a box: index along x, value along y (higher values higher up), inset so
 * edge markers stay whole. Values that are not finite numbers leave gaps. The area fills toward
 * zero, stopping at the edge nearest zero when zero is outside the value range.
 */
export declare function resolveSparklineGeometry(input: SparklineGeometryInput): SparklineGeometry;
//# sourceMappingURL=sparkline-geometry.d.ts.map