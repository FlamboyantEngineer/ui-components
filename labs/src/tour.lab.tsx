import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { Tour, type TourStep } from '../../src/components/tour/tour.js';
import { UiProvider } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { LabSection, mountLab, StateMatrix } from './chrome/index.js';
import { TourPreparationSections } from './tour-preparation-cases.js';

const placements = ['top', 'bottom', 'start', 'end'] as const;
const modalities = ['modal', 'non-modal'] as const;

/** A button that starts a two-step tour about itself. */
function Opener({
  placement,
  modality,
}: {
  placement: (typeof placements)[number];
  modality: (typeof modalities)[number];
}) {
  const [isOpen, setOpen] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  const steps: TourStep[] = [
    { target, title: 'This button', content: `The step opens at the ${placement}.`, placement },
    { target, title: 'Same button', content: 'A second step against the same target.', placement },
  ];
  return (
    <div style={{ padding: 24 }}>
      <Button ref={target} size="sm" onPress={() => setOpen(true)}>
        Tour {placement}
      </Button>
      <Tour
        steps={steps}
        isOpen={isOpen}
        onOpenChange={setOpen}
        isNonModal={modality === 'non-modal'}
        data-lab-tour={`${placement}-${modality}`}
      />
    </div>
  );
}

/** A non-modal tour about a button inside a pane that scrolls on its own. */
function ScrollingPane() {
  const [isOpen, setOpen] = useState(false);
  const target = useRef<HTMLButtonElement>(null);
  return (
    <div
      style={{ height: 240, overflow: 'auto', border: '1px solid', padding: 16 }}
      data-lab-pane="scrolling"
      // A scrollable region reachable from the keyboard.
      tabIndex={0}
      role="region"
      aria-label="Scrolling pane"
    >
      <p>Scroll this pane while the step shows.</p>
      <Button ref={target} size="sm" onPress={() => setOpen(true)}>
        Tour in a pane
      </Button>
      <div style={{ height: 600 }} />
      <Tour
        steps={[{ target, title: 'In a pane', content: 'The step follows this button.' }]}
        isOpen={isOpen}
        onOpenChange={setOpen}
        isNonModal
        data-lab-tour="pane"
      />
    </div>
  );
}

const pageSteps: TourStep[] = [
  {
    target: '[data-lab-target="search"]',
    title: 'Search',
    content: 'Find a recipe by its name or an ingredient.',
  },
  {
    target: '[data-lab-target="filters"]',
    title: 'Filters',
    content: 'Narrow the list to quick meals or one cuisine.',
    placement: 'end',
  },
  {
    target: '[data-lab-target="list"]',
    title: 'Your recipes',
    content: 'Open a recipe to see its steps.',
    placement: 'top',
  },
  {
    target: '[data-lab-target="share"]',
    title: 'Share',
    content: 'Send the list to a friend.',
    placement: 'bottom end',
  },
];

/** A small page the tours walk through. */
function RecipePage({ name }: { name: string }) {
  return (
    <div data-lab-page={name}>
      <p style={{ display: 'flex', gap: 8, alignItems: 'end', flexWrap: 'wrap' }}>
        <span data-lab-target="search">
          <SearchField label="Search recipes" />
        </span>
        <Button size="sm" data-lab-target="filters">
          Filters
        </Button>
        <Button size="sm" data-lab-target="share">
          Share
        </Button>
      </p>
      <ul data-lab-target="list">
        <li>Lemon tart</li>
        <li>Tomato soup</li>
        <li>Mushroom risotto</li>
      </ul>
    </div>
  );
}

function GuidedPage() {
  const [isOpen, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [outcome, setOutcome] = useState('not started');
  return (
    <div>
      <p>
        <Button onPress={() => setOpen(true)} data-lab-start="page">
          Take the tour
        </Button>{' '}
        Step: <output data-lab-output="step">{step + 1}</output>, outcome:{' '}
        <output data-lab-output="outcome">{outcome}</output>
      </p>
      <RecipePage name="guided" />
      <Tour
        steps={[
          ...pageSteps,
          { target: '#not-on-this-page', title: 'All set', content: 'That is the tour.' },
        ]}
        isOpen={isOpen}
        onOpenChange={setOpen}
        step={step}
        onStepChange={setStep}
        onFinish={() => setOutcome('finished')}
        onSkip={(skipped) => setOutcome(`skipped at step ${skipped + 1}`)}
        data-lab-tour="page"
      />
    </div>
  );
}

/**
 * An uncontrolled step that starts at the third step, Your recipes, each time the tour opens;
 * Back and Next walk from there, and the log lists the steps moved to and each opening.
 */
function LaterStart() {
  const [isOpen, setOpen] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const add = (entry: string) => setLog((list) => [...list, entry]);
  return (
    <div>
      <p>
        <Button
          onPress={() => {
            add('opened');
            setOpen(true);
          }}
          data-lab-start="later"
        >
          Start at the list
        </Button>{' '}
        Log: <output data-lab-output="later-log">{log.join(', ') || 'none'}</output>
      </p>
      <RecipePage name="later" />
      <Tour
        steps={pageSteps.map((step) => ({
          ...step,
          target:
            typeof step.target === 'string'
              ? `[data-lab-page="later"] ${step.target}`
              : step.target,
        }))}
        defaultStep={2}
        isOpen={isOpen}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) add('closed');
        }}
        onStepChange={(step) => add(`step ${String(step + 1)}`)}
        data-lab-tour="later"
      />
    </div>
  );
}

const rememberedKey = 'lab.tour.remembered';

function HighlightTransitions() {
  const [isOpen, setOpen] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  const second = useRef<HTMLButtonElement>(null);
  return (
    <>
      <p>
        <Button onPress={() => setOpen(true)}>Preview highlight transitions</Button>
      </p>
      <p style={{ display: 'flex', gap: 24 }}>
        <Button ref={first}>First highlight</Button>
        <Button ref={second}>Second highlight</Button>
      </p>
      <Tour
        isOpen={isOpen}
        onOpenChange={setOpen}
        steps={[
          { target: '#no-highlight', title: 'Overview', content: 'Start without a highlight.' },
          { target: first, title: 'First highlight', content: 'This highlight appears in place.' },
          { target: second, title: 'Second highlight', content: 'The highlight moves here.' },
          { target: '#no-highlight', title: 'Summary', content: 'Finish without a highlight.' },
        ]}
        data-lab-tour="transitions"
      />
    </>
  );
}

function RememberedTour() {
  const [storage] = useState(() => createMemoryStorage());
  // Each reload mounts the tour afresh; `endings` re-reads the stored completion after it ends.
  const [reloads, setReloads] = useState(0);
  const [, setEndings] = useState(0);
  const completed = storage.getItem(rememberedKey) === 'true';
  return (
    <UiProvider storage={storage}>
      <p>
        Completed: <output data-lab-output="remembered">{completed ? 'yes' : 'no'}</output>{' '}
        <Button size="sm" onPress={() => setReloads((count) => count + 1)}>
          Reload
        </Button>{' '}
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            storage.removeItem(rememberedKey);
            setEndings((count) => count + 1);
          }}
        >
          Forget completion
        </Button>
      </p>
      <RecipePage name="remembered" />
      <Tour
        key={reloads}
        steps={pageSteps.slice(0, 2)}
        defaultOpen={reloads > 0}
        isNonModal
        persistKey={rememberedKey}
        onOpenChange={() => setEndings((count) => count + 1)}
        data-lab-tour="remembered"
      />
    </UiProvider>
  );
}

/** A non-modal tour about the newest order, whose row a refresh replaces and a clear removes. */
function ReplacedTarget() {
  const [isOpen, setOpen] = useState(false);
  const [refreshes, setRefreshes] = useState(0);
  const [isCleared, setCleared] = useState(false);
  const newest = useRef<HTMLLIElement>(null);
  return (
    <div data-lab-replaced="">
      <p style={{ display: 'flex', gap: 8 }}>
        <Button onPress={() => setOpen(true)}>Point at the newest order</Button>
        <Button
          onPress={() => {
            setCleared(false);
            setRefreshes((count) => count + 1);
          }}
        >
          Refresh the list
        </Button>
        <Button onPress={() => setCleared(true)}>Clear the list</Button>
      </p>
      <ul>
        {/* Each refresh adds an order above the newest, so its row is replaced lower down. */}
        {Array.from({ length: refreshes }, (_, index) => (
          <li key={`older-${index}`}>Order {index + 1}</li>
        ))}
        {isCleared ? null : (
          <li key={`newest-${refreshes}`} ref={newest} data-lab-newest="">
            Order {refreshes + 1} (newest)
          </li>
        )}
      </ul>
      <Tour
        isOpen={isOpen}
        onOpenChange={setOpen}
        isNonModal
        steps={[{ target: newest, title: 'Newest order', content: 'It follows a refresh.' }]}
      />
    </div>
  );
}

/** A step whose field clears itself on Escape: that Escape stays with the field. */
function EscapeInContent() {
  const [isOpen, setOpen] = useState(false);
  const [outcome, setOutcome] = useState('open');
  const [draft, setDraft] = useState('Draft text');
  return (
    <div data-lab-demo="escape-in-content">
      <p>
        <Button onPress={() => setOpen(true)}>Open the note tour</Button> Outcome:{' '}
        <output data-lab-output="escape outcome">{outcome}</output>
      </p>
      <Tour
        isOpen={isOpen}
        onOpenChange={setOpen}
        onSkip={() => setOutcome('skipped')}
        steps={[
          {
            target: '#no-highlight-note',
            title: 'Quick note',
            content: (
              <input
                aria-label="Note"
                value={draft}
                onChange={(event) => setDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Escape' || draft === '') return;
                  event.preventDefault();
                  setDraft('');
                }}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

mountLab(
  <>
    <LabSection
      title="Placements and modality"
      description="Each button starts a two-step tour about itself, opening at that side. A modal tour makes the rest of the page inert; a non-modal one leaves it usable."
    >
      <StateMatrix
        axes={{ placement: placements, modality: modalities }}
        render={({ placement, modality }) => <Opener placement={placement} modality={modality} />}
      />
    </LabSection>
    <LabSection
      title="Following a scrolling target"
      description="Start the non-modal tour, then scroll the pane or the page: the step and its arrow stay against the button with the spotlight."
    >
      <ScrollingPane />
    </LabSection>
    <LabSection
      title="A guided page"
      description="Take the tour: Next, Back, Skip or Escape. The last step's target is not on the page, so it shows centred. Focus returns to the button when the tour ends."
    >
      <GuidedPage />
    </LabSection>
    <LabSection
      title="Remembered completion"
      description="A non-modal tour with a persist key. Reload opens it again unless it was finished or skipped; Forget completion clears the key."
    >
      <RememberedTour />
    </LabSection>
    <LabSection
      title="Replaced target"
      description="Open the tour, then refresh the list: the newest order's row is replaced lower down and the spotlight and dialog follow it. Clear the list and the step shows centred; refresh again and it points at the new row."
    >
      <ReplacedTarget />
    </LabSection>
    <LabSection
      title="Escape in the step's content"
      description="Open the tour and press Escape in the note: the first Escape clears the field and the tour stays; the next Escape, with the field empty, skips the tour."
    >
      <EscapeInContent />
    </LabSection>
    <LabSection
      title="Highlight transitions"
      description="Position and size animate only between two highlights. The first highlight and changes to or from a centred step without a highlight appear immediately. Try Next and Back, then scroll or resize the page to follow the target."
    >
      <HighlightTransitions />
    </LabSection>
    <LabSection
      title="Starting at a later step"
      description="defaultStep 2 opens the uncontrolled tour at its third step, Your recipes, with its progress; Back and Next move from there, and closing it (Finish, Skip or Escape) returns it to that step for the next opening."
    >
      <LaterStart />
    </LabSection>
    <TourPreparationSections />
  </>,
);
