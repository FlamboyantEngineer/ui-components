import { useState, type CSSProperties } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  SegmentedBar,
  type SegmentedBarSegment,
  type SegmentedBarShape,
  type SegmentedBarSize,
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

/** A hundred equal small parts and one majority of 900, with or without a remainder. */
function manyParts(remainder: number): { segments: SegmentedBarSegment[]; total: number } {
  const small = Array.from({ length: 100 }, (_, index) => ({
    id: `small-${index}`,
    label: `Part ${index + 1}`,
    value: 1,
  }));
  const majority = { id: 'majority', label: 'Majority', value: 900, tone: 'success' as const };
  return { segments: [...small, majority], total: 1000 + remainder };
}

const tones = ['neutral', 'info', 'success', 'warning', 'danger'] as const;

const barSizes = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const;

const figureData = {
  empty: { segments: [], total: 10 },
  single: {
    segments: [{ id: 'done', label: 'Done', value: 7, tone: 'success' as const }],
    total: 10,
  },
  several: { segments: checks, total: 80 },
  animated: { segments: checks, total: 80 },
} satisfies Record<string, { segments: SegmentedBarSegment[]; total: number }>;

/** One data case at one figure size, in each shape. */
function FigureSizes({ data, size }: { data: keyof typeof figureData; size: SegmentedBarSize }) {
  const { segments, total } = figureData[data];
  return (
    <div style={{ ...column(180), display: 'grid', gap: 12 }}>
      {(['linear', 'donut', 'pie'] as const).map((shape) => (
        <SegmentedBar
          key={shape}
          shape={shape}
          size={size}
          label={`Checks, ${shape}`}
          segments={segments}
          total={total}
          animated={data === 'animated'}
        />
      ))}
    </div>
  );
}

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

function AnimationExample({ shape, animated }: { shape: SegmentedBarShape; animated: boolean }) {
  const [run, setRun] = useState(0);
  return (
    <div style={column(280)} data-lab-animation={`${shape}-${animated ? 'animated' : 'static'}`}>
      <SegmentedBar
        key={run}
        shape={shape}
        animated={animated}
        size="lg"
        label="Checks"
        segments={checks}
        total={80}
        showLegend
      />
      {animated ? (
        <p>
          <Button size="sm" onPress={() => setRun((value) => value + 1)}>
            Replay {shape} animation
          </Button>
        </p>
      ) : null}
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Sizes"
      description="Every size with the legend hidden and shown, in a 180px column. xl, 2xl and 3xl are the bar's own figure sizes, past the shared size scale, with a larger label, total and legend."
    >
      <StateMatrix
        axes={{ legend: ['hidden', 'shown'], size: barSizes }}
        render={({ legend, size }) => (
          <div style={column(180)}>
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
      title="One-time sequential animation"
      description="Opt in with animated: each shape fills once when first visible, in segment order and proportional time across 0.6 seconds, half the shared loop duration. Replay remounts the bar. Reduced motion shows the complete result immediately."
    >
      <StateMatrix
        axes={{ shape: ['linear', 'donut', 'pie'], motion: ['static', 'animated'] }}
        render={({ shape, motion }) => (
          <AnimationExample shape={shape} animated={motion === 'animated'} />
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
      title="Many small parts"
      description="A hundred small parts and a majority share a narrow track; the whole distribution stays inside it, left to right or right to left."
    >
      <StateMatrix
        axes={{ direction: ['ltr', 'rtl'], remainder: ['none', 'explicit'] }}
        render={({ direction, remainder }) => {
          const { segments, total } = manyParts(remainder === 'none' ? 0 : 1000);
          return (
            <div style={column(250)} dir={direction} data-lab-resizable="many">
              <SegmentedBar label="Results" segments={segments} total={total} animated={false} />
            </div>
          );
        }}
      />
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
    <LabSection
      title="Figure sizes"
      description="xl, 2xl and 3xl with no segments, one segment, several segments, and the one-time entry animation, in every shape."
    >
      <StateMatrix
        axes={{ data: ['empty', 'single', 'several', 'animated'], size: ['xl', '2xl', '3xl'] }}
        render={({ data, size }) => <FigureSizes data={data} size={size} />}
      />
    </LabSection>
    <LabSection
      title="Linear, donut and pie"
      description="The same shares and remainder, in every shape and size, with a shared legend."
    >
      <StateMatrix
        axes={{ shape: ['linear', 'donut', 'pie'], size: barSizes }}
        render={({ shape, size }) => (
          <div style={column(180)}>
            <SegmentedBar
              shape={shape}
              size={size}
              label="Checks"
              segments={checks}
              total={80}
              showLegend
            />
          </div>
        )}
      />
    </LabSection>
  </>,
);
