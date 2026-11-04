'use client';

import { useUiStrings } from '../../core/provider.js';
import { useDateFormatter, useLocale } from '../../primitives/index.js';
import type { TimeScaleUnit } from '../../utils/time-scale.js';
import {
  resolveScaleCells,
  type TimelineAxis,
  type TimelineScale,
  timelineScales,
  toInlineStart,
} from './timeline-geometry.js';
import { timelineHooks as hooks } from './timeline-hooks.js';

interface TimelineHeaderProps {
  axis: TimelineAxis;
  scale: TimelineScale;
}

/** Whether a header row names the larger unit above or the scale's own unit below it. */
type ScaleTier = 'major' | 'minor';

const labelFormats: Readonly<Record<string, Intl.DateTimeFormatOptions>> = {
  'major:month': { month: 'long', year: 'numeric' },
  'major:year': { year: 'numeric' },
  'minor:day': { day: 'numeric' },
  'minor:week': { month: 'short', day: 'numeric' },
  'minor:month': { month: 'short' },
};

/** Writes a header cell's label from the first day it covers. */
function useScaleLabel(
  scale: TimelineScale,
): (date: string, unit: TimeScaleUnit, tier: ScaleTier) => string {
  const strings = useUiStrings();
  const plan = timelineScales[scale];
  const major = useDateFormatter({ ...labelFormats[`major:${plan.major}`], timeZone: 'UTC' });
  const minor = useDateFormatter({ ...labelFormats[`minor:${plan.minor}`], timeZone: 'UTC' });
  return (date, unit, tier) => {
    const instant = new Date(date);
    if (unit === 'quarter')
      return strings.timelineQuarter(Math.floor(instant.getUTCMonth() / 3) + 1);
    return (tier === 'major' ? major : minor).format(instant);
  };
}

/**
 * The time scale above the rows, pinned to the top of the viewport while the rows scroll: a row of
 * the larger unit (months or years) over a row of the scale's unit.
 */
export function TimelineHeader({ axis, scale }: TimelineHeaderProps) {
  const isRtl = useLocale().direction === 'rtl';
  const label = useScaleLabel(scale);
  const plan = timelineScales[scale];
  const tiers: Array<[ScaleTier, TimeScaleUnit]> = [
    ['major', plan.major],
    ['minor', plan.minor],
  ];
  return (
    <div
      {...hooks.slot('header')}
      style={{ position: 'sticky', top: 0, zIndex: 2, width: axis.width }}
      aria-hidden="true"
    >
      {tiers.map(([tier, unit]) => (
        <div
          key={tier}
          {...hooks.slot('scale-row', { tier, unit })}
          style={{ position: 'relative' }}
        >
          {resolveScaleCells(axis, unit).map((cell) => (
            <span
              key={cell.start}
              {...hooks.slot('scale-cell')}
              style={{
                position: 'absolute',
                ...toInlineStart(cell.left, isRtl),
                width: cell.width,
              }}
            >
              {label(cell.start, unit, tier)}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
