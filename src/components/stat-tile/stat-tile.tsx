import type { ReactNode } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Tone } from '../../core/props.js';
import { Glyph } from '../../core/provider.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { Card, type CardProps } from '../card/card.js';

/** Which way the value moved: from the sign of the delta. */
export type StatTileTrend = 'up' | 'down' | 'flat';

/** Which way is good: `increase`, `decrease`, or `none` when a change is neither good nor bad. */
export type StatTileGoal = 'increase' | 'decrease' | 'none';

/** The judgement of a change: good, bad or neither. */
export type StatTileTone = Extract<Tone, 'neutral' | 'success' | 'danger'>;

export interface StatTileProps
  extends BaseProps, Pick<CardProps, 'href' | 'target' | 'rel' | 'onAction' | 'isLoading'> {
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

const hooks = createHooks('stat-tile', ['value', 'delta', 'trend-icon', 'description', 'chart']);

const trendGlyphs = { up: 'trend-up', down: 'trend-down', flat: 'trend-flat' } as const;

function toTrend(delta: number): StatTileTrend {
  if (delta > 0) return 'up';
  return delta < 0 ? 'down' : 'flat';
}

/** The tone a trend has toward a goal: the goal's way is `success`, the other way `danger`. */
function resolveTone(trend: StatTileTrend, goal: StatTileGoal): StatTileTone {
  if (trend === 'flat' || goal === 'none') return 'neutral';
  return (trend === 'up') === (goal === 'increase') ? 'success' : 'danger';
}

/** The delta's trend and tone, or nothing to publish without a finite delta. */
function resolveChange(delta: number | undefined, goal: StatTileGoal) {
  if (typeof delta !== 'number' || !Number.isFinite(delta)) return undefined;
  const trend = toTrend(delta);
  return { delta, trend, tone: resolveTone(trend, goal) };
}

/**
 * A compact metric on a card: a label, a formatted value, its change with a trend and a tone that
 * says whether the change is good, a secondary line, and room for a small chart.
 */
export function StatTile({
  label,
  value,
  valueLabel,
  formatOptions,
  delta,
  deltaFormatOptions,
  goal = 'increase',
  description,
  chart,
  className,
  ...rest
}: StatTileProps) {
  const change = resolveChange(delta, goal);
  const format = useNumberFormatter(formatOptions);
  const valueText = valueLabel ?? (typeof value === 'number' ? format.format(value) : null);
  const deltaFormat = useNumberFormatter({
    ...(deltaFormatOptions ?? formatOptions),
    signDisplay: 'exceptZero',
  });
  return (
    <Card
      {...rest}
      {...hooks.root({ className, data: { trend: change?.trend, tone: change?.tone } })}
      title={label}
    >
      {isEmptyNode(valueText) ? null : <div {...hooks.slot('value')}>{valueText}</div>}
      {change ? (
        <div {...hooks.slot('delta')}>
          <Glyph name={trendGlyphs[change.trend]} className={hooks.slotClass('trend-icon')} />
          {deltaFormat.format(change.delta)}
        </div>
      ) : null}
      {isEmptyNode(description) ? null : <div {...hooks.slot('description')}>{description}</div>}
      {isEmptyNode(chart) ? null : <div {...hooks.slot('chart')}>{chart}</div>}
    </Card>
  );
}
