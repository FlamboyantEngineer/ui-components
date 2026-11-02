import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CommentComposer } from '../../src/components/comment-composer/comment-composer.js';
import { SegmentedChoice } from '../../src/components/segmented-choice/segmented-choice.js';
import { LabSection } from './chrome/index.js';
import { LabOutput } from './lab-output.js';

const outcomes = ['succeeds', 'fails'] as const;

/** A draft the page owns: it replaces and resets the text, and its submits settle after a second. */
function HostDraft() {
  const [draft, setDraft] = useState('');
  const [outcome, setOutcome] = useState<(typeof outcomes)[number]>('succeeds');
  const [log, setLog] = useState<string[]>([]);
  const submit = (text: string) =>
    new Promise<void>((resolve, reject) => {
      setLog((list) => [...list, `sent: ${text}`]);
      setTimeout(() => {
        if (outcome === 'fails') {
          setLog((list) => [...list, `failed: ${text}`]);
          reject(new Error('The server refused the comment.'));
        } else {
          setLog((list) => [...list, `saved: ${text}`]);
          resolve();
        }
      }, 1000);
    });
  return (
    <div data-lab-demo="host-draft">
      <SegmentedChoice
        aria-label="Submit"
        size="sm"
        sizing="content"
        options={outcomes.map((value) => ({ value, label: value }))}
        value={outcome}
        onChange={(value) => {
          const match = outcomes.find((option) => option === value);
          if (match) setOutcome(match);
        }}
      />{' '}
      <Button size="sm" variant="secondary" onPress={() => setDraft('Looks good to me.')}>
        Replace the draft
      </Button>{' '}
      <Button size="sm" variant="secondary" onPress={() => setDraft('')}>
        Reset the draft
      </Button>
      <CommentComposer
        label="Reply"
        placeholder="Write a reply to Maria"
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
      />
      <LabOutput name="draft">{JSON.stringify(draft)}</LabOutput>
      <ol data-lab-output="submits">
        {log.map((entry, index) => (
          <li key={index}>{entry}</li>
        ))}
      </ol>
    </div>
  );
}

/** A composer the reader opens, which takes focus as it mounts. */
function OpenOnDemand() {
  const [isOpen, setOpen] = useState(false);
  return (
    <div data-lab-demo="focus-on-mount">
      <Button size="sm" onPress={() => setOpen((open) => !open)}>
        {isOpen ? 'Close the reply' : 'Reply'}
      </Button>
      {isOpen ? (
        <CommentComposer
          label="Quick reply"
          placeholder="Say something kind"
          autoFocus
          onSubmit={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

export function CommentComposerHostCases() {
  return (
    <div data-lab-family="comment-composer-host-cases">
      <LabSection
        title="Draft the page owns"
        description="value and onChange bind the draft to the page, which can replace or reset it. A submit settles after a second: a success clears the draft only if it is still the one sent, and a failure keeps it. Change the draft while a submit is pending to see the difference."
      >
        <HostDraft />
      </LabSection>
      <LabSection
        title="Placeholder and focus on mount"
        description="Reply mounts a composer with its own placeholder that takes focus as it appears; Cancel or a submit closes it."
      >
        <OpenOnDemand />
      </LabSection>
    </div>
  );
}
