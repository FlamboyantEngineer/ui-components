import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Steps, type StepsItem, type StepsStatus } from '../../src/components/steps/steps.js';
import type { Key } from '../../src/core/props.js';
import { requireDefined } from '../../src/utils/require-defined.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const importSteps: StepsItem[] = [
  { id: 'upload', label: 'Upload', description: 'Choose a spreadsheet' },
  { id: 'map', label: 'Map columns', description: 'Match columns to fields' },
  { id: 'check', label: 'Check values', isOptional: true },
  { id: 'import', label: 'Import', description: 'Create the records' },
];

const statuses: StepsStatus[] = ['complete', 'current', 'upcoming', 'error', 'skipped'];

const projectSteps: StepsItem[] = [
  { id: 'setup', label: 'Setup', description: 'Create the workspace' },
  { id: 'implement', label: 'Implement', status: 'error', description: 'Two checks failed' },
  { id: 'review', label: 'Review and approve the changes', description: 'Ask two readers' },
  { id: 'finish', label: 'Finish', isOptional: true },
  { id: 'translate', label: 'Translate', status: 'skipped', isDisabled: true },
  { id: 'announce', label: 'Announce', description: 'Post the release notes' },
  { id: 'measure', label: 'Measure' },
  { id: 'archive', label: 'Archive' },
];

const narrowWidths = { '240': 240, '264': 264, '320': 320, desktop: 960 } as const;

/** An import whose steps the reader walks with Back and Next, returning to earlier steps by press. */
function ImportProgress() {
  const [current, setCurrent] = useState<Key | null>('map');
  const index = importSteps.findIndex((step) => step.id === current);
  const move = (offset: number) => {
    const next = importSteps[current === null ? importSteps.length - 1 : index + offset];
    if (next) setCurrent(next.id);
    else if (offset > 0) setCurrent(null);
  };
  return (
    <div data-lab-demo="import">
      <Steps
        items={importSteps}
        currentKey={current}
        isComplete={current === null}
        onAction={setCurrent}
        aria-label="Import"
      />
      <p data-lab-current>Current step: {current === null ? 'Completed' : String(current)}</p>
      <Button size="sm" isDisabled={index === 0} onPress={() => move(-1)}>
        Back
      </Button>{' '}
      <Button size="sm" isDisabled={current === null} onPress={() => move(1)}>
        {current === null ? 'Completed' : index === importSteps.length - 1 ? 'Finish' : 'Next'}
      </Button>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Orientation and density"
      description="The second step is current: the first is complete and the rest are upcoming. Compact lists keep only the current label in view."
    >
      <StateMatrix
        axes={{ density: ['default', 'compact'], orientation: ['horizontal', 'vertical'] }}
        render={({ density, orientation }) => (
          <div style={{ width: orientation === 'horizontal' ? 520 : undefined }}>
            <Steps
              items={importSteps}
              currentKey="map"
              density={density}
              orientation={orientation}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Narrow containers"
      description="Horizontal steps share the width in equal columns with their labels under the markers. Below 80px a column, and always in the compact density, only the markers stay in the row and the current step's text takes the line below; the other labels are still read."
    >
      <StateMatrix
        axes={{
          steps: ['4', '6', '8'],
          density: ['default', 'compact'],
          width: Object.keys(narrowWidths) as Array<keyof typeof narrowWidths>,
        }}
        render={({ steps, density, width }) => (
          <div style={{ width: narrowWidths[width] }} data-lab-width={width}>
            <Steps
              items={projectSteps.slice(0, Number(steps))}
              currentKey="review"
              density={density}
              onAction={() => {}}
              aria-label={`Project, ${steps} steps, ${density}, ${width}`}
            />
          </div>
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
            currentKey={status === 'current' ? 'step' : null}
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
              { ...requireDefined(importSteps[0]), isDisabled: state === 'one disabled' },
              { ...requireDefined(importSteps[1]), status: 'error' },
              { ...requireDefined(importSteps[2]), status: 'skipped' },
              requireDefined(importSteps[3]),
            ]}
            currentKey="import"
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
    <LabSection
      title="All completed"
      description="Every marker is complete and no step is current, in full and compact layouts."
    >
      <StateMatrix
        axes={{ complete: ['default', 'compact'], orientation: ['horizontal', 'vertical'] }}
        render={({ complete, orientation }) => (
          <div style={{ width: orientation === 'horizontal' ? 520 : undefined }}>
            <Steps items={importSteps} isComplete density={complete} orientation={orientation} />
          </div>
        )}
      />
    </LabSection>
  </>,
);
