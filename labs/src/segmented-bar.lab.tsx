import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  SegmentedBar,
  type SegmentedBarSegment,
} from '../../src/components/segmented-bar/segmented-bar.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column = (width: number): CSSProperties => ({ width });

const checks: SegmentedBarSegment[] = [
  { id: 1, label: 'Passed', value: 42, tone: 'success' },
  { id: '1', label: 'Failed', value: 6, tone: 'danger' },
  { id: 'blocked', label: 'Blocked', value: 4, tone: 'warning' },
  { id: 'skipped', label: 'Skipped', value: 8 },
];

const storage: SegmentedBarSegment[] = [
  { id: 'photos', label: 'Photos', value: 38.5, tone: 'info' },
  { id: 'video', label: 'Video', value: 21 },
  { id: 'documents', label: 'Documents', value: 6.2, tone: 'success' },
];

const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;

function RunningChecks() {
  const [run, setRun] = useState(0);
  const passed = Math.min(run, 9);
  const failed = Math.max(0, run - 9);
  return (
    <div style={column(320)} data-lab-demo="running">
      <SegmentedBar
        label="Nightly checks"
        total={12}
        showLegend
        segments={[
          { id: 1, label: 'Passed', value: passed, tone: 'success' },
          { id: '1', label: 'Failed', value: failed, tone: 'danger' },
        ]}
      />
      <p>
        <Button size="sm" isDisabled={run === 12} onPress={() => setRun(run + 1)}>
          Run next check
        </Button>{' '}
        <Button size="sm" isDisabled={run === 0} onPress={() => setRun(0)}>
          Reset
        </Button>
      </p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes"
      description="Every size with the legend hidden and shown, in a 240px column."
    >
      <StateMatrix
        axes={{ legend: ['hidden', 'shown'], size: ['sm', 'md', 'lg'] }}
        render={({ legend, size }) => (
          <div style={column(240)}>
            <SegmentedBar
              label="Checks"
              size={size}
              segments={checks}
              showLegend={legend === 'shown'}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Tones"
      description="One segment of each tone, with its legend entry, and segments without a tone."
    >
      <StateMatrix
        axes={{ tone: [...tones] }}
        render={({ tone }) => (
          <div style={column(160)}>
            <SegmentedBar
              label={tone}
              showLegend
              segments={[
                { id: 'toned', label: 'Toned', value: 3, tone },
                { id: 'rest', label: 'Rest', value: 1 },
              ]}
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Totals and labels"
      description="A total larger than the segments leaves the rest empty; the total can hide, the label can be only an accessible name, and empty segments keep their entries."
    >
      <StateMatrix
        axes={{ option: ['sum', 'larger total', 'total hidden', 'aria-label only', 'empty'] }}
        render={({ option }) => (
          <div style={column(200)}>
            <SegmentedBar
              {...(option === 'aria-label only' ? { 'aria-label': 'Checks' } : { label: 'Checks' })}
              total={option === 'larger total' ? 120 : undefined}
              showTotal={option !== 'total hidden'}
              showLegend
              segments={
                option === 'empty' ? checks.map((segment) => ({ ...segment, value: 0 })) : checks
              }
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Large amounts"
      description="Two equal finite amounts still split the track equally when their total exceeds the numeric range."
    >
      <div style={column(320)}>
        <SegmentedBar
          label="Large amounts"
          segments={[
            { id: 'first', label: 'First', value: Number.MAX_VALUE },
            { id: 'second', label: 'Second', value: Number.MAX_VALUE, tone: 'info' },
          ]}
          formatOptions={{ notation: 'scientific' }}
          showLegend
        />
      </div>
    </LabSection>
    <LabSection
      title="Space used"
      description="Counts and the total formatted as gigabytes, out of a 128 GB disk."
    >
      <div style={column(360)} data-lab-demo="storage">
        <SegmentedBar
          label="Disk"
          size="lg"
          total={128}
          showLegend
          segments={storage}
          formatOptions={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}
        />
      </div>
    </LabSection>
    <LabSection
      title="Running checks"
      description="Each run fills the bar toward its total of 12: passes first, then failures."
    >
      <RunningChecks />
    </LabSection>
  </>,
);
