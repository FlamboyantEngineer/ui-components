import type { ReactNode } from 'react';
import type { BaseProps, Tone } from '../../core/props.js';
import { type CardProps } from '../card/card.js';
/** Which way the value moved: from the sign of the delta. */
export type StatTileTrend = 'up' | 'down' | 'flat';
/** Which way is good: `increase`, `decrease`, or `none` when a change is neither good nor bad. */
export type StatTileGoal = 'increase' | 'decrease' | 'none';
/** The judgement of a change: good, bad or neither. */
export type StatTileTone = Extract<Tone, 'neutral' | 'success' | 'danger'>;
export interface StatTileProps extends BaseProps, Pick<CardProps, 'href' | 'target' | 'rel' | 'onAction' | 'isLoading'> {
    /** Names the measure; the tile's heading, and its link or button with `href` or `onAction`. */
    label: ReactNode;
    /** The measure. */
    value?: number | undefined;
    /** Replaces the formatted value, such as a value that is not a number. */
    valueLabel?: ReactNode;
    /** How the value is formatted, as for a number field. */
    formatOptions?: Intl.NumberFormatOptions | undefined;
    /** The change since the previous period; its sign sets the trend. */
    delta?: number | undefined;
    /** How the delta is formatted, such as a percent. Defaults to `formatOptions`. */
    deltaFormatOptions?: Intl.NumberFormatOptions | undefined;
    /** Which way is good, setting the delta's tone. Defaults to `increase`. */
    goal?: StatTileGoal | undefined;
    /** A secondary line under the value and delta, such as the period compared. */
    description?: ReactNode;
    /** A small chart under the figures, such as a `Sparkline`, `SegmentedBar` or `ProgressBar`. */
    chart?: ReactNode;
}
/**
 * A compact metric on a card: a label, a formatted value, its change with a trend and a tone that
 * says whether the change is good, a secondary line, and room for a small chart.
 */
export declare function StatTile({ label, value, valueLabel, formatOptions, delta, deltaFormatOptions, goal, description, chart, className, ...rest }: StatTileProps): import("react").JSX.Element;
//# sourceMappingURL=stat-tile.d.ts.map