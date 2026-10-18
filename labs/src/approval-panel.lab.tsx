import { useState } from 'react';
import {
  ApprovalPanel,
  type ApprovalPanelApprover,
} from '../../src/components/approval-panel/approval-panel.js';
import { DecisionControl } from '../../src/components/decision-control/decision-control.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';
import { samplePicture } from './people-samples.js';

/** A fixed clock, so the decision times read the same on every day. */
const getNow = () => new Date(2026, 3, 20, 10, 30);

const maria = { name: 'Maria Santos', colorKey: 'maria' };
const jon = { name: 'Jon Berg', src: samplePicture, colorKey: 'jon' };
const kitchen = { name: 'Kitchen team', kind: 'group' as const, colorKey: 'kitchen' };
const lena = { name: 'Lena Ortiz', colorKey: 'lena' };

const scenarios: Record<string, readonly ApprovalPanelApprover[]> = {
  pending: [
    {
      id: 'maria',
      person: maria,
      decision: 'approved',
      time: new Date(2026, 3, 20, 9, 10).toISOString(),
    },
    { id: 'jon', person: jon, decision: 'pending' },
    { id: 'kitchen', person: kitchen, decision: 'pending' },
  ],
  approved: [
    {
      id: 'maria',
      person: maria,
      decision: 'approved',
      time: new Date(2026, 3, 20, 9, 10).toISOString(),
      comment: 'The new quantities read well.',
    },
    { id: 'jon', person: jon, decision: 'approved', time: '2026-04-19' },
    {
      id: 'kitchen',
      person: kitchen,
      decision: 'abstained',
      time: '2026-04-19',
      comment: 'Not our recipe.',
    },
  ],
  rejected: [
    { id: 'maria', person: maria, decision: 'approved', time: '2026-04-18' },
    {
      id: 'jon',
      person: jon,
      decision: 'rejected',
      time: new Date(2026, 3, 20, 8, 45).toISOString(),
      comment: 'The oven temperature is missing.',
    },
    { id: 'kitchen', person: kitchen, decision: 'pending' },
  ],
};

/** The reader decides in the panel's action area; the panel records it and moves on. */
function DecideDemo() {
  const [approvers, setApprovers] = useState<readonly ApprovalPanelApprover[]>([
    {
      id: 'maria',
      person: maria,
      decision: 'approved',
      time: new Date(2026, 3, 20, 9, 10).toISOString(),
    },
    { id: 'lena', person: lena, decision: 'pending' },
    { id: 'jon', person: jon, decision: 'rejected', time: '2026-04-19', comment: 'Needs a photo.' },
  ]);
  const [log, setLog] = useState('');
  const update = (id: unknown, change: Partial<ApprovalPanelApprover>) =>
    setApprovers((list) =>
      list.map((approver) => (approver.id === id ? { ...approver, ...change } : approver)),
    );
  const isPending = approvers.find((approver) => approver.id === 'lena')?.decision === 'pending';
  return (
    <div>
      <ApprovalPanel
        data-lab-decide
        title="Recipe 42 sign-off"
        approvers={approvers}
        requiredCount={2}
        currentApproverId="lena"
        getNow={getNow}
        onRemind={(id) => setLog(`Reminded ${String(id)}`)}
        onRequestAgain={(id) => update(id, { decision: 'pending', time: null, comment: undefined })}
      >
        {isPending ? (
          <DecisionControl
            onSubmit={({ decision, comment }) =>
              update('lena', {
                decision: decision === 'approve' ? 'approved' : 'rejected',
                time: getNow().toISOString(),
                comment: comment || undefined,
              })
            }
          />
        ) : null}
      </ApprovalPanel>
      <p data-lab-log>{log}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Outcomes"
      description="Pending until enough approve, approved, and rejected by any rejection, with every approver required or only one. The clock is fixed at 20 April 2026, 10:30."
    >
      <StateMatrix
        axes={{
          outcome: ['pending', 'approved', 'rejected'] as const,
          required: ['all', 'one'] as const,
        }}
        render={({ outcome, required }) => (
          <ApprovalPanel
            title={`Recipe ${outcome}, ${required} required`}
            approvers={scenarios[outcome] ?? []}
            requiredCount={required === 'one' ? 1 : undefined}
            getNow={getNow}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Actions and the reader's decision"
      description="Remind a pending approver, request a decided one again, and decide as Lena Ortiz in the action area."
    >
      <DecideDemo />
    </LabSection>
  </>,
);
