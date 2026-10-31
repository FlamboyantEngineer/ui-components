import { useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { Link } from '../../src/components/link/link.js';
import { Switch } from '../../src/components/switch/switch.js';
import { Tab, TabList, TabPanel, Tabs } from '../../src/components/tabs/tabs.js';
import { TextField } from '../../src/components/text-field/text-field.js';
import {
  UnsavedChangesGuard,
  useUnsavedChanges,
  useUnsavedChangesGuard,
} from '../../src/components/unsaved-changes-guard/unsaved-changes-guard.js';
import type { Key } from '../../src/core/props.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A field whose edits count as unsaved until saved, which takes 600ms and can fail. */
function DraftField({
  label,
  initial,
  shouldFail = false,
}: {
  label: string;
  initial: string;
  shouldFail?: boolean;
}) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  useUnsavedChanges({
    isDirty: draft !== saved,
    label,
    onSave: async () => {
      await wait(600);
      if (shouldFail) throw new Error('The server is busy. Try again in a minute.');
      setSaved(draft);
    },
    onDiscard: () => setDraft(saved),
  });
  return <TextField label={label} value={draft} onChange={setDraft} />;
}

function DirtyNote() {
  const { isDirty } = useUnsavedChangesGuard();
  return <p data-lab-dirty="">{isDirty ? 'Unsaved changes' : 'All changes saved'}</p>;
}

/** One question per cell: a dirty source that can or cannot save, with or without a label. */
function QuestionCell({ canSave, isLabelled }: { canSave: boolean; isLabelled: boolean }) {
  useUnsavedChanges({
    isDirty: true,
    label: isLabelled ? 'Recipe notes' : undefined,
    onSave: canSave ? () => wait(300) : undefined,
  });
  const { confirmLeave } = useUnsavedChangesGuard();
  const [answer, setAnswer] = useState('Not asked');
  return (
    <span>
      <Button
        size="sm"
        onPress={() => void confirmLeave().then((ok) => setAnswer(ok ? 'Left' : 'Stayed'))}
      >
        Leave
      </Button>{' '}
      <output>{answer}</output>
    </span>
  );
}

const pages = ['Profile', 'Help'] as const;

/** A tabbed form: switching tabs, following the links or closing the page asks first. */
function GuardedForm() {
  const { confirmLeave } = useUnsavedChangesGuard();
  const [tab, setTab] = useState<Key>('person');
  const [page, setPage] = useState<(typeof pages)[number]>('Profile');
  const [shouldFail, setShouldFail] = useState(false);
  const goTo = (next: (typeof pages)[number]) =>
    void confirmLeave({
      title: 'Leave this page?',
      message: `Open the ${next} page? Save or discard your changes first.`,
    }).then((ok) => ok && setPage(next));
  return (
    <div data-lab-demo="form">
      <nav aria-label="Pages">
        {pages.map((name) => (
          <span key={name}>
            <Link
              onPress={() => goTo(name)}
              aria-current={page === name ? 'page' : undefined}
              isStandalone
            >
              {name}
            </Link>{' '}
          </span>
        ))}
      </nav>
      <p>
        Current page: <strong data-lab-page="">{page}</strong>
      </p>
      <Switch isSelected={shouldFail} onChange={setShouldFail}>
        Fail saves
      </Switch>
      <Tabs
        selectedKey={tab}
        onSelectionChange={(next) => void confirmLeave().then((ok) => ok && setTab(next))}
      >
        <TabList aria-label="Profile sections">
          <Tab id="person">Person</Tab>
          <Tab id="home">Home</Tab>
        </TabList>
        <TabPanel id="person">
          <DraftField label="Display name" initial="Maria Santos" shouldFail={shouldFail} />
        </TabPanel>
        <TabPanel id="home">
          <DraftField label="Home city" initial="Lisbon" shouldFail={shouldFail} />
        </TabPanel>
      </Tabs>
      <DirtyNote />
    </div>
  );
}

/** A side panel with its own guard: closing it asks about its notes alone. */
function NotesPanel({ onClose }: { onClose: () => void }) {
  const { confirmLeave } = useUnsavedChangesGuard();
  return (
    <section aria-label="Notes panel" data-lab-panel="">
      <DraftField label="Panel notes" initial="Buy pears" />
      <Button size="sm" onPress={() => void confirmLeave().then((ok) => ok && onClose())}>
        Close panel
      </Button>
    </section>
  );
}

function NestedGuards() {
  const { confirmLeave } = useUnsavedChangesGuard();
  const [isPanelOpen, setPanelOpen] = useState(true);
  const [left, setLeft] = useState(0);
  return (
    <div data-lab-demo="nested">
      <DraftField label="Page title" initial="Weekly menu" />
      {isPanelOpen ? (
        <UnsavedChangesGuard title="Close the panel?">
          <NotesPanel onClose={() => setPanelOpen(false)} />
        </UnsavedChangesGuard>
      ) : (
        <Button size="sm" onPress={() => setPanelOpen(true)}>
          Open panel
        </Button>
      )}{' '}
      <Button size="sm" onPress={() => void confirmLeave().then((ok) => ok && setLeft(left + 1))}>
        Leave page
      </Button>{' '}
      <output data-lab-left="">Leaves: {left}</output>
    </div>
  );
}

/**
 * A question replaced while its Save runs: Leave asks, and a second later a sign-out asks again.
 * The draft takes two seconds to save, and its end leaves the new question open.
 */
function ReplacedQuestion() {
  const { confirmLeave } = useUnsavedChangesGuard();
  const [answers, setAnswers] = useState<string[]>([]);
  useUnsavedChanges({ isDirty: true, label: 'Trip plan', onSave: () => wait(2000) });
  const ask = (title: string) =>
    void confirmLeave({ title }).then((ok) =>
      setAnswers((list) => [...list, `${title} ${ok ? 'Left' : 'Stayed'}`]),
    );
  return (
    <div data-lab-demo="replaced">
      <Button
        size="sm"
        onPress={() => {
          ask('Leave the plan?');
          setTimeout(() => ask('Sign out now?'), 1000);
        }}
      >
        Leave, then sign out
      </Button>{' '}
      <output data-lab-answers="">{answers.join(' · ') || 'Not asked'}</output>
    </div>
  );
}

/** A source that loses its save a second after Leave asks, as when the connection drops. */
function ChangingSource() {
  const { confirmLeave } = useUnsavedChangesGuard();
  const [isOffline, setOffline] = useState(false);
  const [answer, setAnswer] = useState('Not asked');
  useUnsavedChanges({
    isDirty: true,
    label: 'Packing list',
    onSave: isOffline ? undefined : () => wait(300),
  });
  return (
    <div data-lab-demo="changing">
      <Button
        size="sm"
        onPress={() => {
          setOffline(false);
          setTimeout(() => setOffline(true), 1000);
          void confirmLeave().then((ok) => setAnswer(ok ? 'Left' : 'Stayed'));
        }}
      >
        Leave, then go offline
      </Button>{' '}
      <output data-lab-answer="">{answer}</output>
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Questions"
      description="Leave asks about a dirty source: Save, Discard and Stay when it can save, Discard and Stay as a danger when it cannot; a labelled source is listed."
    >
      <StateMatrix
        axes={{ save: ['can save', 'cannot save'], label: ['labelled', 'unlabelled'] }}
        render={({ save, label }) => (
          <UnsavedChangesGuard shouldConfirmUnload={false}>
            <QuestionCell canSave={save === 'can save'} isLabelled={label === 'labelled'} />
          </UnsavedChangesGuard>
        )}
      />
    </LabSection>
    <LabSection
      title="Guarded form"
      description="Edit a field, then switch tabs or follow a page link: the guard asks to save (600ms, or failing with the switch on), discard or stay. Reloading the page while dirty shows the browser's own prompt."
    >
      <UnsavedChangesGuard>
        <GuardedForm />
      </UnsavedChangesGuard>
    </LabSection>
    <LabSection
      title="Nested guards"
      description="The panel has its own guard: Close panel asks about its notes alone, while Leave page asks about the page title and the panel notes together."
    >
      <UnsavedChangesGuard shouldConfirmUnload={false}>
        <NestedGuards />
      </UnsavedChangesGuard>
    </LabSection>
    <LabSection
      title="A question replaced"
      description="Press the button, then Save at once: a second later a sign-out asks its own question, which answers the first Stayed. The first save still finishes after two seconds, and the sign-out question stays open, ready for Save, Discard or Stay."
    >
      <UnsavedChangesGuard shouldConfirmUnload={false}>
        <ReplacedQuestion />
      </UnsavedChangesGuard>
    </LabSection>
    <LabSection
      title="A source changes under the question"
      description="Press the button: the question offers Save, and a second later the packing list loses its save, so the open question offers Discard alone. A Save pressed before then stops at the packing list and leaves the question open."
    >
      <UnsavedChangesGuard shouldConfirmUnload={false}>
        <ChangingSource />
      </UnsavedChangesGuard>
    </LabSection>
  </>,
);
