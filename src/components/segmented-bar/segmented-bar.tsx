import { useId, type ReactNode, type Ref } from 'react';
import { useNumberFormatter } from '../../primitives/index.js';
import type { AriaLabellingProps } from '../../core/events.js';
import { createHooks } from '../../core/hooks.js';
import type { BaseProps, Key, Size, Tone } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { VisuallyHidden } from '../visually-hidden/visually-hidden.js';

export type SegmentedBarSize = Extract<Size, 'sm' | 'md' | 'lg'>;

/** One named part of the whole. */
export interface SegmentedBarSegment {
  /** Identifies the segment among its siblings. */
  id: Key;
  /** Names the segment in the legend and the summary. */
  label: string;
  /** The segment's amount; values that are not finite, positive numbers count as 0. */
  value: number;
  /** What the segment stands for. Defaults to `neutral`. */
  tone?: Tone | undefined;
}

export interface SegmentedBarProps extends BaseProps, AriaLabellingProps {
  /** The parts, in the order they are drawn. */
  segments: readonly SegmentedBarSegment[];
  /** Visible label. Without one, name the bar with `aria-label` or `aria-labelledby`. */
  label?: ReactNode;
  /** The whole the shares are of. Defaults to the sum of the segments, and is never below it. */
  total?: number | undefined;
  /** Show the total beside the label. Defaults to `true`. */
  showTotal?: boolean | undefined;
  /** Show the summary list as a visible legend. Defaults to `false`: only assistive technology reads it. */
  showLegend?: boolean | undefined;
  /** Track thickness. Defaults to `md`. */
  size?: SegmentedBarSize | undefined;
  /** How counts and the total are formatted, such as with a unit. */
  formatOptions?: Intl.NumberFormatOptions | undefined;
  /** The root element. */
  ref?: Ref<HTMLDivElement> | undefined;
}

/** A segment with its amount made truthful and its percentage of the whole. */
interface ResolvedSegment {
  segment: SegmentedBarSegment;
  value: number;
  share: number;
}

const hooks = createHooks('segmented-bar', [
  'label',
  'total',
  'track',
  'segment',
  'legend',
  'item',
  'swatch',
  'item-label',
  'item-value',
  'item-share',
]);

const shareFormat: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 1 };

function toAmount(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** Each segment's truthful amount and share, and the whole they are shares of. */
function resolveSegmentedBar(
  segments: readonly SegmentedBarSegment[],
  total?: number,
): { total: number; segments: ResolvedSegment[] } {
  const amounts = segments.map((segment) => toAmount(segment.value));
  const whole = Math.max(
    toAmount(total),
    amounts.reduce((sum, value) => sum + value, 0),
  );
  return {
    total: whole,
    segments: segments.map((segment, index) => {
      const value = amounts[index] ?? 0;
      return { segment, value, share: whole > 0 ? (value / whole) * 100 : 0 };
    }),
  };
}

/** The legend list: each segment's label, count and share, visible or read only by assistive technology. */
function SegmentedBarLegend({
  segments,
  formatOptions,
  isVisible,
}: {
  segments: readonly ResolvedSegment[];
  formatOptions: Intl.NumberFormatOptions | undefined;
  isVisible: boolean;
}) {
  const count = useNumberFormatter(formatOptions);
  const percent = useNumberFormatter(shareFormat);
  const list = (
    <ul {...hooks.slot('legend')}>
      {segments.map(({ segment, value, share }) => (
        <li key={segment.id} {...hooks.slot('item', { tone: segment.tone ?? 'neutral' })}>
          <span {...hooks.slot('swatch')} aria-hidden="true" />
          <span {...hooks.slot('item-label')}>{segment.label}</span>{' '}
          <span {...hooks.slot('item-value')}>{count.format(value)}</span>{' '}
          <span {...hooks.slot('item-share')}>{percent.format(share / 100)}</span>
        </li>
      ))}
    </ul>
  );
  return isVisible ? list : <VisuallyHidden>{list}</VisuallyHidden>;
}

/**
 * One bar split into proportional segments, such as passed, failed and skipped checks, with a
 * summary list of each segment's count and share that a legend can show.
 */
export function SegmentedBar({
  segments,
  label,
  total,
  showTotal = true,
  showLegend = false,
  size = 'md',
  formatOptions,
  className,
  ...rest
}: SegmentedBarProps) {
  const labelId = useId();
  const strings = useUiStrings();
  const format = useNumberFormatter(formatOptions);
  const resolved = resolveSegmentedBar(segments, total);
  const hasLabel = label != null && rest['aria-labelledby'] === undefined && !rest['aria-label'];
  return (
    <div
      {...rest}
      {...hooks.root({ className, data: { size } })}
      role="group"
      aria-labelledby={hasLabel ? labelId : rest['aria-labelledby']}
    >
      {label != null ? (
        <span {...hooks.slot('label')} id={labelId}>
          {label}
        </span>
      ) : null}
      {showTotal ? (
        <span {...hooks.slot('total')}>{strings.totalCount(format.format(resolved.total))}</span>
      ) : null}
      <div {...hooks.slot('track')} aria-hidden="true">
        {resolved.segments.map(({ segment, share }) =>
          share > 0 ? (
            <div
              key={segment.id}
              {...hooks.slot('segment', { tone: segment.tone ?? 'neutral' })}
              style={{ width: `${share}%` }}
            />
          ) : null,
        )}
      </div>
      <SegmentedBarLegend
        segments={resolved.segments}
        formatOptions={formatOptions}
        isVisible={showLegend}
      />
    </div>
  );
}
