/** A labelled mark on a scale. */
export interface ScaleTick<Value> {
    /** The value the tick marks. */
    value: Value;
    /** Where the value falls in the range. */
    position: number;
    /** The value as text for the scale's locale. */
    label: string;
}
/** The two ends of an interval; the first end of a domain maps to the first end of its range. */
export type ScaleInterval = readonly [number, number];
export interface LinearScaleOptions {
    /** The values mapped, from the first end to the second. */
    domain: ScaleInterval;
    /** The positions they map to, such as pixels; reversed ends flip the scale. */
    range: ScaleInterval;
    /** About how many ticks to make, clamped to 1–1000. Defaults to 5. */
    tickCount?: number | undefined;
    /** Extends the domain outward to whole tick steps. */
    nice?: boolean | undefined;
    /** Keeps positions inside the range, and values inside the domain, for points beyond them. */
    clamp?: boolean | undefined;
    /** BCP 47 locale of the labels. Defaults to the runtime's. */
    locale?: string | undefined;
    /** Replaces the label format, which by default writes as many decimals as the tick step has. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
}
export interface LinearScale {
    /** The domain, extended to whole tick steps when `nice`. */
    readonly domain: ScaleInterval;
    readonly range: ScaleInterval;
    /** The position of a value; `NaN` for a value that is not a finite number. */
    map(value: number): number;
    /** The value at a position; `NaN` for a position that is not a finite number. */
    invert(position: number): number;
    /** Round values a nice step apart inside the domain, in increasing order. */
    ticks(): Array<ScaleTick<number>>;
    /** A value as a tick label. */
    format(value: number): string;
}
/**
 * A linear scale from a domain of values to a range of positions, with round ticks. Non-finite
 * ends read as 0; a domain whose ends are equal maps every value to the middle of the range.
 */
export declare function createLinearScale(options: LinearScaleOptions): LinearScale;
//# sourceMappingURL=linear-scale.d.ts.map