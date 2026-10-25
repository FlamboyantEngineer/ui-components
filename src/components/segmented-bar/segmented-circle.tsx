import { createHooks } from '../../core/hooks.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { SegmentedBarSegment, SegmentedBarShape } from './segmented-bar.js';

const hooks = createHooks('segmented-bar', ['ring', 'track', 'segment']);

/** The same shares around a full circle; a pie's thicker stroke reaches its center. */
export function SegmentedCircle({
  shape,
  segments,
}: {
  shape: Exclude<SegmentedBarShape, 'linear'>;
  segments: readonly { segment: SegmentedBarSegment; share: number }[];
}) {
  let offset = 0;
  const radius = shape === 'pie' ? 8 : 13;
  return (
    <svg {...hooks.slot('ring')} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle {...hooks.slot('track')} cx="16" cy="16" r={radius} fill="none" />
      {segments.map(({ segment, share }) => {
        const start = offset;
        offset += share;
        return share > 0 ? (
          <circle
            key={toKeyIdentity(segment.id)}
            {...hooks.slot('segment', { tone: segment.tone ?? 'neutral' })}
            cx="16"
            cy="16"
            r={radius}
            fill="none"
            pathLength={100}
            strokeDasharray={`${share} ${100 - share}`}
            strokeDashoffset={-start}
            transform="rotate(-90 16 16)"
          />
        ) : null;
      })}
    </svg>
  );
}
