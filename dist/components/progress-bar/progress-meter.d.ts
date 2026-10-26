import type { ProgressBarProps, ProgressBarTone } from './progress-bar.js';
/**
 * The tone the HTML `meter` element's regions give a value. The region holding `optimum` is good
 * (`success`). With the optimum between the boundaries, the low and high regions are worse
 * (`warning`); with it in the low or high region, the middle is worse and the far region worst
 * (`danger`). A value on a boundary counts as the middle. Without any threshold there is no tone.
 */
export declare function resolveMeterTone(range: {
    value: number;
    minValue: number;
    maxValue: number;
}, { low, high, optimum }: Pick<ProgressBarProps, 'low' | 'high' | 'optimum'>): Exclude<ProgressBarTone, 'neutral'> | undefined;
//# sourceMappingURL=progress-meter.d.ts.map