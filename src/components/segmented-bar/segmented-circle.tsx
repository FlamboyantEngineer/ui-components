import type { CSSProperties, Ref } from 'react';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { SegmentedBarShape } from './segmented-bar.js';
import { segmentedBarHooks as hooks } from './segmented-bar-hooks.js';
import { type SegmentedPart, toSegmentProperties } from './segmented-layout.js';
import type { SegmentedAnimationState } from './use-segmented-animation.js';

/** The same shares around a full circle; a pie's thicker stroke reaches its center. */
export function SegmentedCircle({
  shape,
  segments,
  animationState,
  style,
  ref,
}: {
  shape: Exclude<SegmentedBarShape, 'linear'>;
  segments: readonly SegmentedPart[];
  animationState: SegmentedAnimationState;
  style: CSSProperties;
  ref: Ref<SVGSVGElement>;
}) {
  const radius = shape === 'pie' ? 8 : 13;
  return (
    <svg
      {...hooks.slot('ring', { animationState })}
      style={style}
      ref={ref}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <circle {...hooks.slot('track')} cx="16" cy="16" r={radius} fill="none" />
      {segments.map((part) => {
        const { segment, share, start } = part;
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
            style={toSegmentProperties(part)}
          />
        ) : null;
      })}
    </svg>
  );
}
