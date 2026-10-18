import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Steps, type StepsItem, type StepsStatus } from '../../src/components/steps/steps.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const importSteps: StepsItem[] = [
  { id: 'upload', label: 'Upload', description: 'Choose a spreadsheet' },
  { id: 'map', label: 'Map columns', description: 'Match columns to fields' },
  { id: 'check', label: 'Check values', isOptional: true },
  { id: 'import', label: 'Import', description: 'Create the records' },
];

const statuses: StepsStatus[] = ['complete', 'current', 'upcoming', 'error', 'skipped'];

/** An import whose steps the reader walks with Back and Next, returning to earlier steps by press. */
function ImportProgress() {
  const [current, setCurrent] = useState<Key>('map');
  const index = importSteps.findIndex((step) => step.id === current);
  const move = (offset: number) => {
    const next = importSteps[index + offset];
    if (next) setCurrent(next.id);
  };
  return (
    <div data-lab-demo="import">
      <Steps items={importSteps} currentId={current} onAction={setCurrent} aria-label="Import" />
      <p data-lab-current>Current step: {String(current)}</p>
      <Button size="sm" isDisabled={index === 0} onPress={() => move(-1)}>
        Back
      </Button>{' '}
      <Button size="sm" isDisabled={index === importSteps.length - 1} onPress={() => move(1)}>
        Next
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Orientation and variant"
      description="The second step is current: the first is complete and the rest are upcoming. Compact lists keep only the current label in view."
    >
      <StateMatrix
        axes={{ variant: ['default', 'compact'], orientation: ['horizontal', 'vertical'] }}
        render={({ variant, orientation }) => (
          <Steps items={importSteps} currentId="map" variant={variant} orientation={orientation} />
        )}
      />
    </LabSection>
    <LabSection
      title="Statuses"
      description="A step's own status: complete, current, upcoming, failed or skipped, each with its marker and status words."
    >
      <StateMatrix
        axes={{ status: statuses }}
        render={({ status }) => (
          <Steps
            items={[{ id: 'step', label: 'Map columns', status }]}
            currentId={status === 'current' ? 'step' : null}
            orientation="vertical"
            aria-label={`Step ${status}`}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Returning to a step"
      description="Settled steps are buttons with onAction; the failed one too. Disabled steps and lists refuse presses."
    >
      <StateMatrix
        axes={{ state: ['pressable', 'one disabled', 'all disabled'] }}
        render={({ state }) => (
          <Steps
            items={[
              { ...importSteps[0]!, isDisabled: state === 'one disabled' },
              { ...importSteps[1]!, status: 'error' },
              { ...importSteps[2]!, status: 'skipped' },
              importSteps[3]!,
            ]}
            currentId="import"
            orientation="vertical"
            isDisabled={state === 'all disabled'}
            onAction={() => {}}
            aria-label={`Import, ${state}`}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Import progress"
      description="Back and Next move the current step; pressing a completed step returns to it."
    >
      <ImportProgress />
    </LabSection>
  </>,
);
