import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Steps, type StepsItem, type StepsStatus } from '../../src/components/steps/steps.js';
import {
  CalendarGlyph,
  EditGlyph,
  SendGlyph,
  UploadGlyph,
  UsersGlyph,
} from '../../src/core/glyphs.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { requireDefined } from './require-defined.js';

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

const iconSteps: StepsItem[] = [
  { id: 'upload', label: 'Upload', icon: UploadGlyph },
  { id: 'edit', label: 'Edit', icon: EditGlyph },
  { id: 'invite', label: 'Invite', icon: UsersGlyph, isOptional: true },
  { id: 'schedule', label: 'Schedule', icon: CalendarGlyph },
  { id: 'send', label: 'Send', icon: SendGlyph },
];

/**
 * A sequence whose markers are all custom icons, walked with Back, Next and Reset. Each icon shows
 * while its step is upcoming or current; a completed step shows the check like any other step.
 */
function IconProgress() {
  const [current, setCurrent] = useState<Key | null>('upload');
  const index =
    current === null ? iconSteps.length : iconSteps.findIndex((step) => step.id === current);
  const go = (to: number) => setCurrent(iconSteps[to]?.id ?? null);
  const shared = { items: iconSteps, currentKey: current, isComplete: current === null };
  return (
    <div data-lab-demo="icons" style={{ display: 'grid', gap: 16 }}>
      <Steps {...shared} aria-label="Publishing, horizontal" />
      <div style={{ display: 'flex', gap: 32, alignItems: 'start' }}>
        <Steps {...shared} orientation="vertical" aria-label="Publishing, vertical" />
        <div style={{ width: 280 }}>
          <Steps {...shared} density="compact" aria-label="Publishing, compact" />
        </div>
      </div>
      <p data-lab-current>Current step: {current === null ? 'Completed' : String(current)}</p>
      <p style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" isDisabled={index === 0} onPress={() => go(index - 1)}>
          Back
        </Button>
        <Button size="sm" isDisabled={current === null} onPress={() => go(index + 1)}>
          Next
        </Button>
        <Button size="sm" isDisabled={index === 0} onPress={() => go(0)}>
          Reset
        </Button>
      </p>
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
      title="Right to left"
      description="In a right-to-left page vertical steps hang from markers on the right, and each connector runs down under its marker."
    >
      <div dir="rtl" data-lab-demo="rtl">
        <Steps
          items={[
            { id: 'map', label: 'Map columns' },
            { id: 'check', label: 'Check rows' },
            { id: 'import', label: 'Import' },
          ]}
          currentKey="check"
          orientation="vertical"
          aria-label="Import steps, right to left"
        />
      </div>
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
      title="Custom icons"
      description="Every step draws its own icon instead of a number while it is upcoming or current. Next completes the current step, which then shows the check, so finished steps stay recognisable; Back returns a step to current, and Reset starts over. Next on the last step completes the sequence. The same state is drawn horizontal, vertical and compact; the markers are decorative, so each step is still named by its label and status words."
    >
      <IconProgress />
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
