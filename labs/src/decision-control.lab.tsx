import { useState, type ReactNode } from 'react';
import {
  DecisionControl,
  type DecisionControlDetails,
} from '../../src/components/decision-control/decision-control.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const votes = [
  { value: '-2', label: '−2', requiresComment: true },
  { value: '-1', label: '−1', requiresComment: true },
  { value: '0', label: '0' },
  { value: '1', label: '+1' },
  { value: '2', label: '+2' },
];

const pickedValues = { none: null, approve: 'approve', reject: 'reject' } as const;

/** Writes what was submitted under the control, as a caller would record it. */
function Recorded({
  name,
  render,
}: {
  name: string;
  render: (onSubmit: (details: DecisionControlDetails) => void) => ReactNode;
}) {
  const [record, setRecord] = useState('');
  return (
    <div>
      {render(({ decision, comment, signature }) =>
        setRecord(
          `${decision}${comment ? `: ${comment}` : ''}${signature ? ` (signed by ${signature.userName})` : ''}`,
        ),
      )}
      <p data-lab-record={name}>{record}</p>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Comments and states"
      description="Approve and Reject with no decision, an approval or a rejection picked, and a comment that is optional, required, or not asked; Reject always asks for one."
    >
      <StateMatrix
        axes={{
          picked: ['none', 'approve', 'reject'] as const,
          comment: ['optional', 'required', 'none'] as const,
        }}
        render={({ picked, comment }) => (
          <DecisionControl
            label={`Decision, ${picked}, ${comment}`}
            defaultValue={pickedValues[picked]}
            comment={comment}
            onSubmit={() => {}}
          />
        )}
      />
      <StateMatrix
        axes={{ state: ['disabled'] as const }}
        render={() => (
          <DecisionControl
            label="Decision, disabled"
            defaultValue="approve"
            isDisabled
            signature={{ userName: 'Ada Park' }}
            onSubmit={() => {}}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Submitting"
      description="An approval recorded after a short wait, and one that fails and shows why."
    >
      <Recorded
        name="submit"
        render={(record) => (
          <DecisionControl
            label="Submit and record"
            onSubmit={(details) =>
              new Promise<void>((resolve) => setTimeout(resolve, 300)).then(() => record(details))
            }
          />
        )}
      />
      <DecisionControl
        label="Submit and fail"
        defaultValue="approve"
        onSubmit={() =>
          Promise.reject(new Error('The review closed before your decision arrived.'))
        }
      />
      <DecisionControl
        label="Submit and throw"
        defaultValue="approve"
        onSubmit={() => {
          throw new Error('The decision could not be recorded.');
        }}
      />
    </LabSection>
    <LabSection
      title="Scored vote"
      description="A vote from −2 to +2 where only the negative scores ask for a reason."
    >
      <Recorded
        name="vote"
        render={(record) => (
          <DecisionControl
            label="Vote"
            options={votes}
            comment="none"
            submitLabel="Vote"
            onSubmit={record}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Signed decision"
      description="Submit opens a signature dialog that states the decision and asks for the password again: “sample” signs, any other password is refused."
    >
      <Recorded
        name="signed"
        render={(record) => (
          <DecisionControl
            label="Signed decision"
            signature={{ userName: 'Ada Park' }}
            onSubmit={(details) => {
              if (details.signature?.password !== 'sample') {
                return Promise.reject(new Error('The password is incorrect.'));
              }
              record(details);
              return undefined;
            }}
          />
        )}
      />
    </LabSection>
  </>,
);
