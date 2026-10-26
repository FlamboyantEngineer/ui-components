import type { ScaleInterval, ScaleTick } from './linear-scale.js';
export interface BandScaleOptions {
    /** The categories, in the order their bands follow each other. */
    domain: readonly string[];
    /** The positions the bands fill, such as pixels; reversed ends lay the bands out backwards. */
    range: ScaleInterval;
    /** The share of each step left empty between bands, from 0 to 1. Defaults to 0.2. */
    padding?: number | undefined;
}
export interface BandScale {
    readonly domain: readonly string[];
    readonly range: ScaleInterval;
    /** The distance between the starts of two neighbouring bands. */
    readonly step: number;
    /** The length of each band. */
    readonly bandwidth: number;
    /** Where a category's band starts, at its lower position; `NaN` for a category not in the domain. */
    map(category: string): number;
    /** One tick per category, at the middle of its band, labelled with the category. */
    ticks(): Array<ScaleTick<string>>;
}
/**
 * A band scale that splits a range into one equal step per category, each holding a band with
 * `padding` of the step left empty around it (half on each outer edge), as the bars of a bar
 * chart are laid out. Repeated categories keep their first band.
 */
export declare function createBandScale(options: BandScaleOptions): BandScale;
//# sourceMappingURL=band-scale.d.ts.map