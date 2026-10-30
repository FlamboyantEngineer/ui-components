'use client';

import { useState } from 'react';
import { createHooks, measuredProperty } from '../../core/hooks.js';
import { toKeyIdentity } from '../../utils/to-key-identity.js';
import type { SegmentedBarShape } from './segmented-bar.js';
import { SegmentedCircle } from './segmented-circle.js';
import { toSegmentProperties, type SegmentedPart } from './segmented-layout.js';
import { useSegmentedAnimation } from './use-segmented-animation.js';

const hooks = createHooks('segmented-bar', ['track', 'segment']);

/** The decorative geometry owns visibility and animation completion, apart from the live legend. */
export function SegmentedTrack({
  shape,
  segments,
  animated,
}: {
  shape: SegmentedBarShape;
  segments: readonly SegmentedPart[];
  animated: boolean;
}) {
  const [element, setElement] = useState<HTMLDivElement | SVGSVGElement | null>(null);
  const animationState = useSegmentedAnimation(element, animated);
  const totalShare = segments.reduce((sum, part) => sum + part.share, 0);
  const style = measuredProperty('segment-total', String(totalShare));
  if (shape !== 'linear') {
    return (
      <SegmentedCircle
        shape={shape}
        segments={segments}
        animationState={animationState}
        style={style}
        ref={setElement}
      />
    );
  }
  return (
    <div
      {...hooks.slot('track', { animationState })}
      style={style}
      ref={setElement}
      aria-hidden="true"
    >
      {segments.map((part) =>
        part.share > 0 ? (
          <div
            key={toKeyIdentity(part.segment.id)}
            {...hooks.slot('segment', { tone: part.segment.tone ?? 'neutral' })}
            style={{ width: `${part.share}%`, ...toSegmentProperties(part) }}
          />
        ) : null,
      )}
    </div>
  );
}
