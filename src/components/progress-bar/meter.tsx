'use client';

import { type ReactNode, useId } from 'react';
import type { AriaLabellingProps } from '../../core/events.js';
import type { BaseProps, RefProps } from '../../core/props.js';
import { isEmptyNode } from '../../utils/is-empty-node.js';
import { joinIds } from '../../utils/join-ids.js';
import type { ElementRender } from '../../utils/render-element.js';
import type {
  ProgressBarShape,
  ProgressBarSize,
  ProgressBarTone,
  ProgressRangeProps,
} from './progress-bar.js';
import { meterHooks as hooks } from './progress-bar-hooks.js';
import type { MeterThresholds } from './progress-meter.js';
import { ProgressRing } from './progress-ring.js';
import { ProgressRoot, ProgressText } from './progress-root.js';

export type MeterShape = ProgressBarShape;
export type MeterSize = ProgressBarSize;

/** What the measured value means: `neutral` passes no judgement. */
export type MeterTone = ProgressBarTone;

/** What a meter draws from: the value's share of the range and its value text. */
export interface MeterValues {
  /** The value's percentage of the range. */
  percentage: number;
  /** The formatted value, or `valueLabel`. */
  valueText: string | undefined;
}

export interface MeterProps
  extends
    BaseProps,
    AriaLabellingProps,
    ProgressRangeProps,
    MeterThresholds,
    RefProps<HTMLDivElement> {
  /** Visible label. Without one, name the meter with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** Text under the meter that says more about the measurement; it describes the meter. */
  description?: ReactNode;
  /** Show the value text. Defaults to `true` for a linear meter and `false` for a ring. */
  showValueLabel?: boolean | undefined;
  /** Draws a linear track or a circular ring. Defaults to `linear`. */
  shape?: MeterShape | undefined;
  /** Track thickness or ring size. Defaults to `md`. */
  size?: MeterSize | undefined;
  /** What the value means. Defaults to the thresholds' judgement, else `neutral`. */
  tone?: MeterTone | undefined;
  /** Replaces the root with the caller's element and receives the measured values. */
  render?: ElementRender<'div', MeterValues> | undefined;
}

/**
 * A measured quantity inside a known range, such as storage used or a battery's charge: never work
 * toward completion, so it has no indeterminate or complete state. `low`, `high` and `optimum` judge
 * its tone as the HTML `meter` element's regions do.
 */
export function Meter({
  label,
  description,
  shape = 'linear',
  showValueLabel = shape === 'linear',
  size = 'md',
  low,
  high,
  optimum,
  render,
  valueLabel,
  ...rest
}: MeterProps) {
  const descriptionId = useId();
  const hasDescription = !isEmptyNode(description);
  // Untyped callers may still pass an element, which would read as `[object Object]`.
  const text = typeof valueLabel === 'string' && valueLabel.trim() ? valueLabel : undefined;
  return (
    <ProgressRoot
      {...rest}
      mode="meter"
      hooks={hooks}
      shape={shape}
      size={size}
      valueLabel={text}
      thresholds={{ low, high, optimum }}
      aria-describedby={joinIds(
        rest['aria-describedby'],
        hasDescription ? descriptionId : undefined,
      )}
      render={
        render
          ? (props, values) =>
              render(props, { percentage: values.percentage ?? 0, valueText: values.valueText })
          : undefined
      }
    >
      {(values) => (
        <>
          <ProgressText
            hooks={hooks}
            label={label}
            showValueLabel={showValueLabel}
            values={values}
          />
          {shape === 'circular' ? (
            <ProgressRing hooks={hooks} gap={100 - (values.percentage ?? 0)} />
          ) : (
            <div {...hooks.slot('track')}>
              <div {...hooks.slot('fill')} style={{ width: `${values.percentage ?? 0}%` }} />
            </div>
          )}
          {hasDescription ? (
            <span id={descriptionId} {...hooks.slot('description')}>
              {description}
            </span>
          ) : null}
        </>
      )}
    </ProgressRoot>
  );
}
