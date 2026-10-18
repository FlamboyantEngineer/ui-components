import type { ReactNode, Ref } from 'react';
import {
  Label,
  Meter as AriaMeter,
  type MeterProps as AriaMeterProps,
} from 'react-aria-components';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Size, Tone } from '../../core/props.js';
import { clamp } from '../../utils/clamp.js';
import { resolveProgressRange } from '../progress-bar/progress-bar.js';

export type MeterSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** How good the measured quantity is: `neutral` for no judgement, else good, worse or worst. */
export type MeterTone = Extract<Tone, 'neutral' | 'success' | 'warning' | 'danger'>;

export interface MeterProps
  extends Omit<AriaMeterProps, 'className' | 'style' | 'children'>, BaseProps {
  /** Visible label. Without one, name the meter with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Show the value text beside the bar. Defaults to `true`. */
  showValueLabel?: boolean | undefined;
  /** Track thickness. Defaults to `md`. */
  size?: MeterSize | undefined;
  /** How good the value is. Defaults to the thresholds' tone when one is set, else `neutral`. */
  tone?: MeterTone | undefined;
  /** The upper end of the low region, as on the HTML `meter` element. Defaults to the minimum. */
  low?: number | undefined;
  /** The lower end of the high region, as on the HTML `meter` element. Defaults to the maximum. */
  high?: number | undefined;
  /** The best value, whose region is good, as on the HTML `meter` element. Defaults to the middle. */
  optimum?: number | undefined;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

const hooks = createHooks('meter', ['label', 'value', 'track', 'fill']);

/** Where a value sits: below the low boundary, above the high one, or between them. */
function findRegion(value: number, low: number, high: number): 'low' | 'middle' | 'high' {
  if (value < low) return 'low';
  return value > high ? 'high' : 'middle';
}

/**
 * The tone the HTML `meter` element's regions give a value. The region holding `optimum` is good
 * (`success`). With the optimum between the boundaries, the low and high regions are worse
 * (`warning`); with it in the low or high region, the middle is worse and the far region worst
 * (`danger`). A value on a boundary counts as the middle. Without any threshold there is no tone.
 */
export function resolveMeterTone(
  range: { value: number; minValue: number; maxValue: number },
  { low, high, optimum }: Pick<MeterProps, 'low' | 'high' | 'optimum'>,
): Exclude<MeterTone, 'neutral'> | undefined {
  if (low === undefined && high === undefined && optimum === undefined) return undefined;
  const { value, minValue, maxValue } = range;
  const lowBoundary = clamp(low ?? minValue, minValue, maxValue);
  const highBoundary = clamp(high ?? maxValue, lowBoundary, maxValue);
  const best = findRegion(
    clamp(optimum ?? (minValue + maxValue) / 2, minValue, maxValue),
    lowBoundary,
    highBoundary,
  );
  const current = findRegion(value, lowBoundary, highBoundary);
  if (current === best) return 'success';
  return best === 'middle' || current === 'middle' ? 'warning' : 'danger';
}

/**
 * A bar showing a quantity within a known range, such as storage used or a score (React Aria
 * `Meter`). Unlike a progress bar it measures an amount, not work toward completion; the HTML
 * `meter` thresholds can judge the value through its tone.
 */
export function Meter({
  label,
  showValueLabel = true,
  size = 'md',
  tone,
  low,
  high,
  optimum,
  value,
  minValue,
  maxValue,
  className,
  ...rest
}: MeterProps) {
  const range = resolveProgressRange({ value, minValue, maxValue });
  const judged = tone ?? resolveMeterTone(range, { low, high, optimum }) ?? 'neutral';
  return (
    <AriaMeter {...rest} {...hooks.root({ className, data: { size, tone: judged } })} {...range}>
      {({ percentage, valueText }) => (
        <>
          {label != null ? <Label className={hooks.slotClass('label')}>{label}</Label> : null}
          {showValueLabel ? <span {...hooks.slot('value')}>{valueText}</span> : null}
          <div {...hooks.slot('track')}>
            <div {...hooks.slot('fill')} style={{ width: `${percentage}%` }} />
          </div>
        </>
      )}
    </AriaMeter>
  );
}
