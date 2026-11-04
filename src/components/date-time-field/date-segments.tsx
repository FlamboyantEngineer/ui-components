'use client';

import { type ComponentProps, useRef } from 'react';
import { DateInput, DateSegment } from '../../primitives/index.js';
import { normalizeIntlSpaces } from '../../utils/intl-format.js';
import { DraftAwareSegment } from './date-draft.js';
import { dateTimeFieldHooks as hooks } from './date-time-field-hooks.js';
import { useSegmentWheel } from './time-segment-steps.js';

/** One segment; the wheel over a time segment steps it. */
function SteppingSegment({ segment }: { segment: ComponentProps<typeof DateSegment>['segment'] }) {
  const ref = useRef<HTMLDivElement>(null);
  useSegmentWheel(ref, segment);
  return (
    <DateSegment ref={ref} segment={segment} className={hooks.slotClass('segment')}>
      {({ text }) => normalizeIntlSpaces(text, '\u00a0')}
    </DateSegment>
  );
}

/** A run of segments: a value's, or a range's start or end. */
export function Segments({ slot }: { slot?: 'start' | 'end' }) {
  return (
    <DateInput slot={slot} className={hooks.slotClass('input')}>
      {(segment) => (
        <DraftAwareSegment segment={segment} slot={slot}>
          <SteppingSegment segment={segment} />
        </DraftAwareSegment>
      )}
    </DateInput>
  );
}
