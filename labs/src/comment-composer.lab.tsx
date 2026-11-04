import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { CommentComposer } from '../../src/components/comment-composer/comment-composer.js';
import { Switch } from '../../src/components/switch/switch.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { CommentComposerHostCases } from './comment-composer-host-cases.js';

const drafts = { empty: '', draft: 'The pears arrive on Tuesday.\nCan we move the tasting?' };

/** Submits after a delay, failing when asked, so the pending state and a kept draft show. */
function PendingComposer() {
  const [shouldFail, setShouldFail] = useState(false);
  const [posted, setPosted] = useState<string[]>([]);
  const [status, setStatus] = useState('idle');
  const submit = (text: string) =>
    new Promise<void>((resolve, reject) => {
      setStatus('sending');
      window.setTimeout(() => {
        if (shouldFail) {
          setStatus('failed');
          reject(new Error('offline'));
          return;
        }
        setStatus('sent');
        setPosted((list) => [...list, text]);
        resolve();
      }, 1500);
    });
  return (
    <div>
      <Switch isSelected={shouldFail} onChange={setShouldFail}>
        Fail the next submit
      </Switch>
      <CommentComposer
        label="Reply"
        submitLabel="Send"
        onSubmit={submit}
        data-lab-composer="pending"
      />
      <p>
        Status: <output data-lab-output="status">{status}</output>
      </p>
      <ol data-lab-output="posted">
        {posted.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ol>
    </div>
  );
}

/** A draft kept in the provider storage: unmount the composer and mount it again to resume. */
function StoredDraft() {
  const [isShown, setIsShown] = useState(true);
  const [cancelled, setCancelled] = useState(0);
  return (
    <div>
      <Button size="sm" onPress={() => setIsShown((shown) => !shown)}>
        {isShown ? 'Unmount composer' : 'Mount composer'}
      </Button>
      {isShown ? (
        <CommentComposer
          persistKey="lab:comment-draft"
          onSubmit={() => {}}
          onCancel={() => setCancelled((count) => count + 1)}
          data-lab-composer="stored"
        />
      ) : null}
      <p>
        Cancelled: <output data-lab-output="cancelled">{cancelled}</output>
      </p>
    </div>
  );
}

const threads = ['Orchard', 'Market'] as const;

/** One composer that moves between threads, each with its own stored draft, sending slowly. */
function ThreadDrafts() {
  const [thread, setThread] = useState<(typeof threads)[number]>('Orchard');
  const [posted, setPosted] = useState<string[]>([]);
  const submit = (text: string) =>
    new Promise<void>((resolve) => {
      window.setTimeout(() => {
        setPosted((list) => [...list, text]);
        resolve();
      }, 1500);
    });
  return (
    <div>
      {threads.map((name) => (
        <Button key={name} size="sm" isDisabled={name === thread} onPress={() => setThread(name)}>
          {`Open ${name}`}
        </Button>
      ))}
      <CommentComposer
        label={`Reply in ${thread}`}
        persistKey={`lab:thread-draft:${thread}`}
        onSubmit={submit}
        data-lab-composer="threads"
      />
      <ol data-lab-output="thread-posted">
        {posted.map((text, index) => (
          <li key={index}>{text}</li>
        ))}
      </ol>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="States"
      description="Empty and with a draft, with and without onCancel (which keeps Cancel shown), and disabled."
    >
      <StateMatrix
        axes={{
          draft: ['empty', 'draft'],
          state: ['default', 'with onCancel', 'disabled'],
        }}
        render={({ draft, state }) => (
          <CommentComposer
            defaultValue={drafts[draft]}
            onSubmit={() => {}}
            onCancel={state === 'with onCancel' ? () => {} : undefined}
            isDisabled={state === 'disabled'}
          />
        )}
      />
    </LabSection>
    <LabSection
      title="Pending submits"
      description="Ctrl+Enter or Command+Enter sends; the composer stays pending for 1.5 seconds and keeps the draft when the submit fails. Text typed while it sends stays once the submit succeeds. Keys that confirm or cancel an input method composition neither send nor cancel."
    >
      <PendingComposer />
    </LabSection>
    <LabSection
      title="Stored draft"
      description="With persistKey, type, unmount and mount again: the draft comes back from the provider storage. Escape or Cancel clears it."
    >
      <StoredDraft />
    </LabSection>
    <LabSection
      title="Switching threads"
      description="Send in one thread, then open the other before the 1.5-second submit settles: only the sent thread's draft clears, and the other thread is not pending."
    >
      <ThreadDrafts />
    </LabSection>
    <CommentComposerHostCases />
  </>,
);
