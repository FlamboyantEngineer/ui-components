// Lab controls for an overlay's position props, shared by the overlay labs: offset, cross offset,
// viewport padding and flipping, with the values shown as the props they set.

import { useState } from 'react';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Switch } from '../../src/components/switch/switch.js';
import type { OverlayPositionProps } from '../../src/core/events.js';

type OverlayGeometry = Required<
  Pick<OverlayPositionProps, 'offset' | 'crossOffset' | 'shouldFlip' | 'containerPadding'>
>;

/** The geometry state and the controls that set it. */
export function useOverlayGeometry(start: OverlayGeometry) {
  const [geometry, setGeometry] = useState(start);
  const set = (change: Partial<OverlayGeometry>) =>
    setGeometry((current) => ({ ...current, ...change }));
  const controls = (
    <div role="group" aria-label="Position" data-lab-geometry>
      <NumberField
        label="Offset"
        size="sm"
        value={geometry.offset}
        onChange={(value) => set({ offset: value ?? 0 })}
      />
      <NumberField
        label="Cross offset"
        size="sm"
        value={geometry.crossOffset}
        onChange={(value) => set({ crossOffset: value ?? 0 })}
      />
      <NumberField
        label="Container padding"
        size="sm"
        value={geometry.containerPadding}
        onChange={(value) => set({ containerPadding: value ?? 0 })}
      />
      <Switch isSelected={geometry.shouldFlip} onChange={(shouldFlip) => set({ shouldFlip })}>
        Flip when it does not fit
      </Switch>
      <p data-lab-output="position">
        offset {geometry.offset}, crossOffset {geometry.crossOffset}, containerPadding{' '}
        {geometry.containerPadding}, shouldFlip {String(geometry.shouldFlip)}
      </p>
    </div>
  );
  return { geometry, controls };
}
