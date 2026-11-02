// Popover cases for its position near the edge of the viewport, padding included, and a trigger
// that opens its popover as soon as it mounts.

import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Popover, PopoverTrigger } from '../../src/components/popover/popover.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';
import { useOverlayGeometry } from './overlay-geometry-controls.js';

/**
 * A popover that prefers the top. Scroll the trigger to the top of the window: with flipping on it
 * opens below, with flipping off it stays above, kept the container padding from the edge.
 */
function TunedPopover() {
  const { geometry, controls } = useOverlayGeometry({
    offset: 12,
    crossOffset: 0,
    containerPadding: 24,
    shouldFlip: true,
  });
  return (
    <div data-lab-demo="popover-geometry">
      {controls}
      <PopoverTrigger>
        <Button>Crate details</Button>
        <Popover placement="top" {...geometry} title="Crate 12" showArrow data-lab-popover="tuned">
          <p>Pears, picked on Friday.</p>
        </Popover>
      </PopoverTrigger>
    </div>
  );
}

/** A trigger mounted on demand whose popover opens at once. */
function OpenOnMount() {
  const [isMounted, setMounted] = useState(false);
  const [changes, setChanges] = useState<string[]>([]);
  return (
    <div data-lab-demo="popover-default-open">
      <Button size="sm" variant="secondary" onPress={() => setMounted((mounted) => !mounted)}>
        {isMounted ? 'Remove the tip' : 'Add the tip'}
      </Button>{' '}
      {isMounted ? (
        <PopoverTrigger
          defaultOpen
          onOpenChange={(isOpen) => setChanges((list) => [...list, isOpen ? 'open' : 'closed'])}
        >
          <Button>Tip</Button>
          <Popover title="Tip" showCloseButton data-lab-popover="default-open">
            <p>Opened by defaultOpen when its trigger mounted.</p>
          </Popover>
        </PopoverTrigger>
      ) : null}
      <LabOutput name="Tip changes">{changes.join(', ') || 'none'}</LabOutput>
    </div>
  );
}

export function PopoverCoverageSections() {
  return (
    <>
      <LabSection
        title="Edge padding"
        description="placement top with the offset, cross offset, containerPadding and flipping set below. Scroll the trigger to the top of the window: with flipping on the popover opens below it; with flipping off it stays above, and containerPadding sets the space it keeps from the window's edge."
      >
        <TunedPopover />
      </LabSection>
      <LabSection
        title="Open on mount"
        description="defaultOpen on PopoverTrigger opens the popover as soon as the trigger mounts; onOpenChange is listed."
      >
        <OpenOnMount />
      </LabSection>
    </>
  );
}
