import { useRef, useState } from 'react';
import { Button } from '../../src/components/button/button.js';
import { SearchField } from '../../src/components/search-field/search-field.js';
import { Tour, type TourStep } from '../../src/components/tour/tour.js';
import { UiProvider } from '../../src/core/provider.js';
import { createMemoryStorage } from '../../src/core/storage.js';
import { LabSection, StateMatrix, mountLab } from './chrome/index.js';

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
      title="Highlight transitions"
      description="Position and size animate only between two highlights. The first highlight and changes to or from a centred step without a highlight appear immediately. Try Next and Back."
    >
      <HighlightTransitions />
    </LabSection>
  </>,
);
