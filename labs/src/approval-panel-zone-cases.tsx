import { useState } from 'react';
import {
  ApprovalPanel,
  type ApprovalPanelApprover,
} from '../../src/components/approval-panel/approval-panel.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { getNearMidnightNow, nearMidnightInstant, ZoneComparison } from './time-zone-samples.js';

/** Decisions against a clock at 23:30 UTC on 20 April: near the day boundary, and three days back. */
const approvers: readonly ApprovalPanelApprover[] = [
  {
    id: 'maria',
    person: { name: 'Maria Santos', colorKey: 'maria' },
    decision: 'approved',
    time: nearMidnightInstant,
  },
  {
    id: 'jon',
    person: { name: 'Jon Berg', colorKey: 'jon' },
    decision: 'approved',
    time: '2026-04-17T12:00:00Z',
  },
  { id: 'lena', person: { name: 'Lena Ortiz', colorKey: 'lena' }, decision: 'pending' },
];

const thresholds = ['1', '2', '7'] as const;

/** The panel with the reader's zone and absolute-date threshold. */
function ZonedApprovals() {
  const [threshold, setThreshold] = useState<(typeof thresholds)[number]>('7');
  return (
    <div data-lab-demo="approval-zones">
      <SegmentedChoice
        aria-label="Dates after"
        size="sm"
        sizing="content"
        options={thresholds.map((value) => ({
          value,
          label: value === '1' ? '1 day' : `${value} days`,
        }))}
        value={threshold}
        onChange={(value) => {
          const match = thresholds.find((option) => option === value);
          if (match) setThreshold(match);
        }}
      />
      <ZoneComparison>
        {({ timeZone }) => (
          <ApprovalPanel
            title="Menu sign-off"
            approvers={approvers}
            getNow={getNearMidnightNow}
            timeZone={timeZone}
            fallbackAfterDays={Number(threshold)}
          />
        )}
      </ZoneComparison>
    </div>
  );
}

export function ApprovalPanelZoneCases() {
  return (
    <LabSection
      title="Time zones and dates"
      description="The clock is fixed at 20 April 2026, 23:30 UTC. Decision times follow the provider's zone, or the panel's own timeZone, and read as dates once older than the chosen number of days."
    >
      <ZonedApprovals />
    </LabSection>
  );
}
