import { type ReactNode, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import {
  DecisionControl,
  type DecisionControlDetails,
} from '../../src/components/decision-control/decision-control.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';

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

/** A signed decision another reader changes while it is being signed (UIC-DECISION-CONTROL-1.5). */
function ChangedWhileSigning() {
  const [decision, setDecision] = useState<string | null>('approve');
  return (
    <Recorded
      name="changed"
      render={(record) => (
        <>
          <Button size="sm" onPress={() => setTimeout(() => setDecision('reject'), 2000)}>
            Switch to Reject in 2 seconds
          </Button>
          <DecisionControl
            label="Decision changed while signing"
            value={decision}
            onChange={setDecision}
            signature={{ userName: 'Ada Park' }}
            onSubmit={record}
          />
        </>
      )}
    />
  );
}

type CompactSetup = 'optional comment' | 'no comment' | 'signed' | 'disabled';

/** One control in a narrow column, as a side panel would hold it. */
function CompactDecision({
  picked,
  setup,
}: {
  picked: keyof typeof pickedValues;
  setup: CompactSetup;
}) {
  return (
    <div style={{ width: 240 }}>
      <DecisionControl
        label={`Narrow, ${picked} picked, ${setup}`}
        defaultValue={pickedValues[picked]}
        comment={setup === 'no comment' ? 'none' : 'optional'}
        signature={setup === 'signed' ? { userName: 'Ada Park' } : undefined}
        isDisabled={setup === 'disabled'}
        onSubmit={() =>
          Promise.reject(new Error('The review closed before your decision arrived.'))
        }
      />
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
      title="Sizes"
      description="The four control sizes side by side: the decisions, the comment and Submit take the same size, with long decision names and a comment that is optional or required. Submit a rejection without a comment to see the validation at each size."
    >
      <StateMatrix
        axes={{
          size: ['xs', 'sm', 'md', 'lg'] as const,
          comment: ['optional', 'required'] as const,
        }}
        render={({ size, comment }) => (
          <DecisionControl
            label={`Release decision, ${size}, ${comment} comment`}
            size={size}
            comment={comment}
            options={[
              { value: 'approve', label: 'Approve the release as planned' },
              { value: 'hold', label: 'Hold for another review', requiresComment: true },
            ]}
            defaultValue="approve"
            onSubmit={() => {}}
            data-lab-size={`${size} ${comment}`}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Compact width"
      description="Each state in a 240 pixel column: the comment starts at two rows and keeps no room for a message it has not got. Submit fails in every cell, so the error shows where it would."
    >
      <StateMatrix
        axes={{
          picked: ['none', 'approve', 'reject'] as const,
          setup: ['optional comment', 'no comment', 'signed', 'disabled'] as const,
        }}
        render={({ picked, setup }) => <CompactDecision picked={picked} setup={setup} />}
      />
    </LabSection>
    <LabSection
      title="Submitting"
      description="An approval recorded after a short wait, one recorded after 1.5 seconds (a comment typed meanwhile stays once it is recorded), and ones that fail and show why."
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
      <Recorded
        name="slow"
        render={(record) => (
          <DecisionControl
            label="Submit slowly"
            defaultValue="approve"
            onSubmit={(details) =>
              new Promise<void>((resolve) => setTimeout(resolve, 1500)).then(() => record(details))
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
    <LabSection
      title="Changed while signing"
      description="Press the switch, then Submit: when the decision turns to Reject two seconds later, the signature dialog closes, because Reject needs a comment. Submit again to sign the new decision."
    >
      <ChangedWhileSigning />
    </LabSection>
  </>,
);
