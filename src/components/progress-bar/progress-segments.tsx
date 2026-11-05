'use client';

import type { Key } from '../../core/props.js';
import { useUiStrings } from '../../core/provider.js';
import { useNumberFormatter } from '../../primitives/index.js';
import type { ProgressBarProps } from './progress-bar.js';
import { progressBarHooks as hooks } from './progress-bar-hooks.js';
import { ProgressRoot, ProgressText } from './progress-root.js';

/** Where one unit of work stands: done, under way, or not started. */
export type ProgressSegmentState = 'complete' | 'current' | 'pending';

/** One discrete unit of work in a segmented progress bar. */
export interface ProgressSegment {
  /** Identifies the unit across renders; unique within the bar. */
  id: Key;
  /** Names the unit; the value text names the current unit by it. */
  label: string;
  /** Whether the unit is done, under way or not started. */
  state: ProgressSegmentState;
}

/** What a segmented bar measures: completed units of the total, and the unit under way. */
interface SegmentProgress {
  completed: number;
  total: number;
  /** The first `current` unit; later ones draw as pending. */
  current: ProgressSegment | undefined;
}

/** The state a unit draws in: only `complete` counts, and only the first `current` is current. */
function resolveDrawnState(segment: ProgressSegment, current: ProgressSegment | undefined) {
  if (segment.state === 'complete') return 'complete';
  return segment === current ? 'current' : 'pending';
}

/** Counts the completed units and finds the unit under way; unknown states count as pending. */
function resolveSegmentProgress(segments: readonly ProgressSegment[]): SegmentProgress {
  return {
    completed: segments.filter((segment) => segment.state === 'complete').length,
    total: segments.length,
    current: segments.find((segment) => segment.state === 'current'),
  };
}

/** A linear bar of discrete units: completed, the one under way, and pending. */
export function SegmentedProgressBar({
  segments,
  label,
  showValueLabel = true,
  valueLabel,
  size = 'md',
  ...rest
}: ProgressBarProps & { segments: readonly ProgressSegment[] }) {
  const strings = useUiStrings();
  const count = useNumberFormatter();
  const percent = useNumberFormatter({ style: 'percent' });
  const progress = resolveSegmentProgress(segments);
  const parts = {
    completed: count.format(progress.completed),
    total: count.format(progress.total),
    percent: percent.format(progress.total > 0 ? progress.completed / progress.total : 0),
    current: progress.current?.label,
  };
  return (
    <ProgressRoot
      {...rest}
      hooks={hooks}
      size={size}
      shape="linear"
      mode="progress"
      isIndeterminate={false}
      isSegmented
      value={progress.completed}
      minValue={0}
      maxValue={progress.total}
      formatOptions={undefined}
      valueLabel={valueLabel ?? strings.segmentProgress(parts)}
    >
      {(values) => (
        <>
          <ProgressText
            hooks={hooks}
            label={label}
            showValueLabel={showValueLabel}
            values={
              valueLabel == null ? { ...values, valueText: strings.segmentCount(parts) } : values
            }
          />
          <div {...hooks.slot('track')}>
            {segments.map((segment) => (
              <div
                key={`${typeof segment.id}:${segment.id}`}
                {...hooks.slot('segment', { state: resolveDrawnState(segment, progress.current) })}
              />
            ))}
          </div>
        </>
      )}
    </ProgressRoot>
  );
}
