import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  ProgressBar,
  type ProgressSegment,
  type ProgressSegmentState,
} from '../../src/components/progress-bar/index.js';
import { LabSection, StateMatrix } from './chrome/index.js';

const stageNames = ['Setup', 'Draft', 'Review', 'Revise', 'Test', 'Publish', 'Archive'];
const progressCases = ['none', 'partial', 'no current', 'complete'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const widths = ['240px', '320px', '480px'] as const;
const counts = ['4', '12', '30', '80'] as const;

/** `count` units: `completed` done, then one current unit when `hasCurrent`, then pending. */
function createUnits(options: {
  count: number;
  completed: number;
  hasCurrent: boolean;
}): ProgressSegment[] {
  return Array.from({ length: options.count }, (_, index) => {
    let state: ProgressSegmentState = 'pending';
    if (index < options.completed) state = 'complete';
    else if (index === options.completed && options.hasCurrent) state = 'current';
    return { id: `unit-${index + 1}`, label: stageNames[index] ?? `Unit ${index + 1}`, state };
  });
}

function caseUnits(progress: (typeof progressCases)[number]) {
  const count = stageNames.length;
  if (progress === 'none') return createUnits({ count, completed: 0, hasCurrent: false });
  if (progress === 'partial') return createUnits({ count, completed: 1, hasCurrent: true });
  if (progress === 'no current') return createUnits({ count, completed: 3, hasCurrent: false });
  return createUnits({ count, completed: count, hasCurrent: false });
}

/** No units, a second current unit and an unknown state, or ordinary partial progress. */
function edgeUnits(option: string): ProgressSegment[] {
  if (option === 'empty') return [];
  const partial = caseUnits('partial');
  if (option !== 'invalid') return partial;
  return partial.map((unit, index) => {
    if (index === 3) return { ...unit, state: 'current' };
    if (index === 4) return { ...unit, state: 'unknown' as ProgressSegmentState };
    return unit;
  });
}

function SteppedStages() {
  const [completed, setCompleted] = useState(1);
  const count = stageNames.length;
  return (
    <div data-lab-demo="segments-step" style={{ width: 320 }}>
      <ProgressBar
        label="Publishing stages"
        segments={createUnits({ count, completed, hasCurrent: completed < count })}
      />
      <p>
        <Button
          size="sm"
          isDisabled={completed === 0}
          onPress={() => setCompleted((value) => value - 1)}
        >
          Previous stage
        </Button>{' '}
        <Button
          size="sm"
          isDisabled={completed === count}
          onPress={() => setCompleted((value) => value + 1)}
        >
          Finish stage
        </Button>
      </p>
    </div>
  );
}

export function ProgressSegmentCases() {
  return (
    <div data-lab-family="progress-segment-cases">
      <LabSection
        title="Segments: Progress and sizes"
        description="Seven stages with none done, one done and the next under way (1/7, 14%), three done with none under way, and all done."
      >
        <StateMatrix
          axes={{ progress: progressCases, size: sizes }}
          render={({ progress, size }) => (
            <div style={{ width: 240 }}>
              <ProgressBar label="Stages" size={size} segments={caseUnits(progress)} />
            </div>
          )}
        />
      </LabSection>
      <LabSection
        title="Segments: Narrow and many"
        description="From 4 to 80 units at 240, 320 and 480 pixels; the gaps narrow as units grow so the track never overflows."
      >
        <StateMatrix
          axes={{ count: counts, width: widths }}
          render={({ count, width }) => {
            const total = Number(count);
            return (
              <div style={{ width }}>
                <ProgressBar
                  label="Files checked"
                  segments={createUnits({
                    count: total,
                    completed: Math.floor(total / 3),
                    hasCurrent: true,
                  })}
                />
              </div>
            );
          }}
        />
      </LabSection>
      <LabSection
        title="Segments: Tone, value text and edges"
        description="A failed tone, a caller value label, a hidden value, an empty list and a list with a second current and an unknown state, which draw as pending."
      >
        <StateMatrix
          axes={{ option: ['danger', 'value label', 'value hidden', 'empty', 'invalid'] }}
          render={({ option }) => {
            const units = edgeUnits(option);
            return (
              <div style={{ width: 240 }}>
                <ProgressBar
                  label={option === 'danger' ? 'Stages failed' : 'Stages'}
                  tone={option === 'danger' ? 'danger' : undefined}
                  valueLabel={option === 'value label' ? 'Stage 2 of 7' : undefined}
                  showValueLabel={option !== 'value hidden'}
                  segments={units}
                />
              </div>
            );
          }}
        />
      </LabSection>
      <LabSection
        title="Segments: Step through stages"
        description="Finish the current stage to move the stripes to the next one; the last stage completes the bar."
      >
        <SteppedStages />
      </LabSection>
    </div>
  );
}
