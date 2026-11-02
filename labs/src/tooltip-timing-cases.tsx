// Tooltip cases for how long a hint lingers after the pointer leaves, and whether pressing its
// trigger closes it.

import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { NumberField } from '../../src/components/number-field/number-field.js';
import { Tooltip } from '../../src/components/tooltip/tooltip.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

/** A hint whose close delay is set below; the output reports how long it stayed after leaving. */
function CloseDelay() {
  const [closeDelay, setCloseDelay] = useState(1500);
  const [isOpen, setOpen] = useState(false);
  const [lingered, setLingered] = useState('not yet');
  // The pointer's leaving and the hint's closing, in whichever order they arrive.
  const stamps = useRef({ left: 0, closed: 0 });
  const stamp = (key: 'left' | 'closed') => {
    stamps.current[key] = performance.now();
    const { left, closed } = stamps.current;
    if (left && closed) {
      setLingered(`${String(Math.max(0, Math.round((closed - left) / 250) * 250))} ms`);
    }
  };
  return (
    <div data-lab-demo="close-delay">
      <NumberField
        label="Close delay (ms)"
        size="sm"
        minValue={0}
        step={250}
        value={closeDelay}
        onChange={(value) => setCloseDelay(value ?? 0)}
      />
      <Tooltip
        content="Saved to the orchard log"
        delay={0}
        closeDelay={closeDelay}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) stamp('closed');
        }}
      >
        <Button
          size="sm"
          onHoverStart={() => (stamps.current = { left: 0, closed: 0 })}
          onHoverEnd={() => stamp('left')}
        >
          Save
        </Button>
      </Tooltip>
      <LabOutput name="Close delay open">{String(isOpen)}</LabOutput>
      <LabOutput name="Stayed after leaving">{lingered}</LabOutput>
    </div>
  );
}

/** One trigger whose press closes its hint and one whose press keeps it open. */
function PressPolicy({ shouldCloseOnPress }: { shouldCloseOnPress: boolean }) {
  const [isOpen, setOpen] = useState(false);
  const [presses, setPresses] = useState(0);
  const name = shouldCloseOnPress ? 'Press closes' : 'Press keeps open';
  return (
    <div data-lab-demo={shouldCloseOnPress ? 'press-closes' : 'press-keeps'}>
      <Tooltip
        content={shouldCloseOnPress ? 'Closes when pressed' : 'Stays while pressed'}
        delay={0}
        shouldCloseOnPress={shouldCloseOnPress}
        onOpenChange={setOpen}
      >
        <Button size="sm" onPress={() => setPresses((count) => count + 1)}>
          {name}
        </Button>
      </Tooltip>
      <LabOutput name={`${name} open`}>{String(isOpen)}</LabOutput>
      <LabOutput name={`${name} presses`}>{presses}</LabOutput>
    </div>
  );
}

export function TooltipTimingSections() {
  return (
    <>
      <LabSection
        title="Close delay"
        description="closeDelay sets how long the hint stays after the pointer leaves the trigger (500 ms by default). Hover Save, move away and read how long it stayed; set 0 to close at once."
      >
        <CloseDelay />
      </LabSection>
      <LabSection
        title="Pressing the trigger"
        description="shouldCloseOnPress (true by default) closes the hint when its trigger is pressed by pointer, Enter or Space; false keeps it open. Hover or Tab to each button, then click it or press Enter."
      >
        <PressPolicy shouldCloseOnPress />
        <PressPolicy shouldCloseOnPress={false} />
      </LabSection>
    </>
  );
}
