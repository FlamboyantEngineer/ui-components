import { useState, type CSSProperties } from 'react';
import { ProgressBar } from '../../src/components/progress-bar/progress-bar.js';
import { SegmentedBar } from '../../src/components/segmented-bar/segmented-bar.js';
import { Sparkline } from '../../src/components/sparkline/sparkline.js';
import { StatTile } from '../../src/components/stat-tile/stat-tile.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const column = (width: number): CSSProperties => ({ width });
const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: 12,
  maxWidth: 880,
};

const deltas = { rise: 12, fall: -8, flat: 0 } as const;
const measures = {
  increase: 'Orders',
  decrease: 'Open defects',
  none: 'Room temperature',
} as const;
const periods = { rise: 'this week', fall: 'this month', flat: 'this year' } as const;

function PressableTile() {
  const [opened, setOpened] = useState(0);
  return (
    <div style={column(220)} data-lab-demo="pressable">
      <StatTile
        label="Open requests"
        value={128}
        delta={-6}
        goal="decrease"
        description={`Opened ${opened} times`}
        onAction={() => setOpened(opened + 1)}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Trends and goals"
      description="A rise, a fall and no change judged against each goal: the tone says whether the change is good."
    >
      <StateMatrix
        axes={{
          goal: ['increase', 'decrease', 'none'],
          delta: Object.keys(deltas) as Array<keyof typeof deltas>,
        }}
        render={({ goal, delta }) => (
          <div style={column(180)}>
            <StatTile
              label={`${measures[goal]} ${periods[delta]}`}
              value={1284}
              delta={deltas[delta]}
              goal={goal}
              description="Since the previous period"
            />
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Values"
      description="A plain count, a percent with a percent delta, a fall too small to show that keeps its sign (-0%), a compact currency, a worded value, no delta and a loading tile."
    >
      <StateMatrix
        axes={{
          value: ['count', 'percent', 'tiny change', 'currency', 'worded', 'no delta', 'loading'],
        }}
        render={({ value }) => (
          <div style={column(170)}>
            {value === 'count' ? <StatTile label="Visitors" value={5230} delta={410} /> : null}
            {value === 'percent' ? (
              <StatTile
                label="Uptime"
                value={0.9987}
                formatOptions={{ style: 'percent', maximumFractionDigits: 2 }}
                delta={-0.0004}
                deltaFormatOptions={{ style: 'percent', maximumFractionDigits: 2 }}
              />
            ) : null}
            {value === 'tiny change' ? (
              <StatTile
                label="Error rate"
                value={0.012}
                formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
                delta={-0.00001}
                goal="decrease"
              />
            ) : null}
            {value === 'currency' ? (
              <StatTile
                label="Revenue"
                value={48200}
                formatOptions={{ style: 'currency', currency: 'EUR', notation: 'compact' }}
                delta={3100}
              />
            ) : null}
            {value === 'worded' ? (
              <StatTile label="Status" valueLabel="Healthy" description="All checks pass" />
            ) : null}
            {value === 'no delta' ? <StatTile label="Members" value={42} /> : null}
            {value === 'loading' ? <StatTile label="Costs" value={0} isLoading /> : null}
          </div>
        )}
      />
    </LabSection>
    <LabSection
      title="Dashboard"
      description="Tiles with a sparkline, a segmented bar and a meter in the chart slot; one tile links elsewhere."
    >
      <div style={grid} data-lab-demo="dashboard">
        <StatTile
          label="Daily builds"
          value={86}
          delta={9}
          description="Last 14 days"
          href="#builds"
          chart={
            <Sparkline
              aria-label="Builds per day"
              values={[52, 60, 58, 66, 61, 70, 72, 69, 75, 77, 74, 80, 77, 86]}
              variant="area"
              width={200}
              height={36}
              markers={['last']}
            />
          }
        />
        <StatTile
          label="Checks"
          value={60}
          delta={-2}
          goal="decrease"
          description="Failures since yesterday"
          chart={
            <SegmentedBar
              aria-label="Check results"
              showTotal={false}
              size="sm"
              segments={[
                { id: 'passed', label: 'Passed', value: 52, tone: 'success' },
                { id: 'failed', label: 'Failed', value: 4, tone: 'danger' },
                { id: 'skipped', label: 'Skipped', value: 4 },
              ]}
            />
          }
        />
        <StatTile
          label="Storage"
          value={0.72}
          formatOptions={{ style: 'percent' }}
          delta={0.05}
          deltaFormatOptions={{ style: 'percent' }}
          goal="none"
          chart={
            <ProgressBar
              mode="meter"
              aria-label="Storage used"
              value={72}
              showValueLabel={false}
              size="sm"
            />
          }
        />
      </div>
    </LabSection>
    <LabSection
      title="Press target"
      description="With onAction the whole tile is a press target named by its label."
    >
      <PressableTile />
    </LabSection>
  </>,
);
